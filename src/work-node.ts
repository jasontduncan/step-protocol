import { promises as fs, statSync, readFileSync, Dirent } from "node:fs";
import path from "node:path";

export type StepStatus = "todo" | "in-progress" | "blocked" | "done" | "superseded";

export interface StepIdentifier {
  phase: number;
  step: string;
  label: string;
}

export interface PlanStep extends StepIdentifier {
  details?: string[];
}

export interface StateRow extends StepIdentifier {
  status: StepStatus;
  progressLog: string | null;
}

export interface LogMetadata extends StepIdentifier {
  logPath: string;
  status: StepStatus;
  started: string;
}

export interface WorkNodeLayout {
  root: string;
  planPath: string;
  statePath: string;
  logsDir: string;
}

export class WorkPlan {
  readonly steps: PlanStep[];

  constructor(steps: PlanStep[] = []) {
    this.steps = [...steps];
  }

  add(step: PlanStep): void {
    if (this.find(step.phase, step.step)) {
      throw new Error(`step ${step.phase}.${step.step} already exists in plan`);
    }
    this.steps.push(step);
  }

  find(phase: number, step: string): PlanStep | undefined {
    return this.steps.find((row) => row.phase === phase && row.step === step);
  }
}

export class WorkState {
  readonly entries: StateRow[];

  constructor(entries: StateRow[] = []) {
    this.entries = [...entries];
  }

  find(phase: number, step: string): StateRow | undefined {
    return this.entries.find((entry) => entry.phase === phase && entry.step === step);
  }

  listByStatus(status: StepStatus): StateRow[] {
    return this.entries.filter((entry) => entry.status === status);
  }
}

export class WorkNodeSchema {
  constructor(
    public readonly layout: WorkNodeLayout,
    public readonly plan: WorkPlan,
    public readonly state: WorkState,
    public readonly logs: LogMetadata[] = []
  ) {}

  getStepKey(entry: StepIdentifier): string {
    return `${entry.phase}:${entry.step}:${entry.label}`;
  }
}

const STEP_DECLARATION_REGEX = /^\s*-\s*Step\s+(\d+)\.([0-9]+(?:\.[0-9]+)*)\s*:\s*(.+)$/i;
const DETAIL_LINE_REGEX = /^\s*-\s+(?!Step)(.+)$/i;
const STATE_ROW_REGEX = /^\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|$/;
const STATUS_LINE_REGEX = /^status:\s*.+$/m;
const COMPLETED_LINE_REGEX = /^completed:\s*.+$/m;
const VALID_STATUSES: Set<StepStatus> = new Set(["todo", "in-progress", "blocked", "done", "superseded"]);

function parsePlanLines(lines: string[]): PlanStep[] {
  const steps: PlanStep[] = [];
  let current: PlanStep | null = null;
  let detailBuffer: string[] = [];

  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    const declaration = STEP_DECLARATION_REGEX.exec(line);
    if (declaration) {
      if (current) {
        if (detailBuffer.length) {
          current.details = [...detailBuffer];
        }
        steps.push(current);
        detailBuffer = [];
      }
      current = {
        phase: Number(declaration[1]),
        step: declaration[2],
        label: declaration[3].trim()
      };
      continue;
    }

    if (current) {
      const detailMatch = DETAIL_LINE_REGEX.exec(line);
      if (detailMatch) {
        detailBuffer.push(detailMatch[1].trim());
      }
    }
  }

  if (current) {
    if (detailBuffer.length) {
      current.details = [...detailBuffer];
    }
    steps.push(current);
  }

  return steps;
}

function parseStateRows(lines: string[]): StateRow[] {
  const rows: StateRow[] = [];
  for (const raw of lines) {
    const trimmed = raw.trim();
    if (!trimmed || trimmed.startsWith("| Phase") || trimmed.startsWith("| -----")) {
      continue;
    }
    const match = STATE_ROW_REGEX.exec(raw);
    if (!match) {
      continue;
    }
    const phase = Number(match[1].trim());
    const step = match[2].trim();
    const label = match[3].trim();
    const status = match[4].trim() as StepStatus;
    if (!VALID_STATUSES.has(status)) {
      throw new Error(`unexpected status '${status}' in STATE.md`);
    }
    const progressLogCell = match[5].trim();
    rows.push({
      phase,
      step,
      label,
      status,
      progressLog: progressLogCell === "-" || progressLogCell === "" ? null : progressLogCell
    });
  }
  return rows;
}

export async function parsePlan(planPath: string): Promise<WorkPlan> {
  const content = await fs.readFile(planPath, "utf8");
  return new WorkPlan(parsePlanLines(content.split(/\r?\n/)));
}

export function parsePlanSync(planPath: string): WorkPlan {
  const content = readFileSync(planPath, "utf8");
  return new WorkPlan(parsePlanLines(content.split(/\r?\n/)));
}

export async function parseState(statePath: string): Promise<WorkState> {
  const content = await fs.readFile(statePath, "utf8");
  return new WorkState(parseStateRows(content.split(/\r?\n/)));
}

export function parseStateSync(statePath: string): WorkState {
  const content = readFileSync(statePath, "utf8");
  return new WorkState(parseStateRows(content.split(/\r?\n/)));
}

function buildStepKey(identifier: Pick<StepIdentifier, "phase" | "step">): string {
  return `${identifier.phase}:${identifier.step}`;
}

function parseStepSequence(step: string): number[] {
  return step.split(".").map((segment) => {
    const parsed = Number(segment);
    return Number.isNaN(parsed) ? 0 : parsed;
  });
}

export function compareStepIdentifiers(a: StepIdentifier, b: StepIdentifier): number {
  if (a.phase !== b.phase) {
    return a.phase - b.phase;
  }
  const aParts = parseStepSequence(a.step);
  const bParts = parseStepSequence(b.step);
  const maxLength = Math.max(aParts.length, bParts.length);
  for (let i = 0; i < maxLength; i += 1) {
    const aValue = aParts[i] ?? 0;
    const bValue = bParts[i] ?? 0;
    if (aValue !== bValue) {
      return aValue - bValue;
    }
  }
  return 0;
}

export function findNextActionableStep(state: WorkState): StateRow | undefined {
  const inProgress = state.entries.filter((entry) => entry.status === "in-progress");
  if (inProgress.length) {
    return inProgress[0];
  }
  const todo = state.entries.filter((entry) => entry.status === "todo");
  const sorted = [...todo].sort(compareStepIdentifiers);
  return sorted[0];
}

export interface LogPaths {
  absolute: string;
  relative: string;
}

export function canonicalLogPaths(layout: WorkNodeLayout, identifier: StepIdentifier): LogPaths {
  const name = `p${identifier.phase}-s${identifier.step}.md`;
  const absolute = path.join(layout.logsDir, name);
  const relative = path
    .relative(layout.root, absolute)
    .split(path.sep)
    .join("/");
  return { absolute, relative };
}

export async function createStepLog(
  layout: WorkNodeLayout,
  planStep: PlanStep,
  status: StepStatus = "in-progress"
): Promise<string> {
  const { absolute, relative } = canonicalLogPaths(layout, planStep);
  await fs.mkdir(layout.logsDir, { recursive: true });
  const planDetails = planStep.details ?? [];
  const scope = planDetails.length ? planDetails.join(" · ") : planStep.label;
  const planChecklist =
    planDetails.length > 0
      ? planDetails.map((detail) => `- [ ] ${detail}`).join("\n")
      : "- [ ] TODO";
  const template = [
    `# Phase ${planStep.phase} – Step ${planStep.step}: ${planStep.label}`,
    `status: ${status}`,
    `started: ${new Date().toISOString()}`,
    "",
    "## Scope",
    scope,
    "",
    "## Plan",
    planChecklist,
    "",
    "## Notes",
    "",
    "## Outcomes",
    ""
  ].join("\n");
  try {
    await fs.writeFile(absolute, template, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") {
      throw error;
    }
  }
  return relative;
}

export async function updateLogHeader(
  logPath: string,
  updates: { status?: StepStatus; completed?: string }
): Promise<void> {
  if (!updates.status && !updates.completed) {
    return;
  }
  let contents = await fs.readFile(logPath, "utf8");
  if (updates.status) {
    if (STATUS_LINE_REGEX.test(contents)) {
      contents = contents.replace(STATUS_LINE_REGEX, `status: ${updates.status}`);
    } else {
      contents = `status: ${updates.status}\n${contents}`;
    }
  }
  if (updates.completed) {
    if (COMPLETED_LINE_REGEX.test(contents)) {
      contents = contents.replace(COMPLETED_LINE_REGEX, `completed: ${updates.completed}`);
    } else {
      const startedMatch = contents.match(/^started:.*$/m);
      if (startedMatch && typeof startedMatch.index === "number") {
        const insertPosition = startedMatch.index + startedMatch[0].length;
        contents =
          contents.slice(0, insertPosition) +
          `\ncompleted: ${updates.completed}` +
          contents.slice(insertPosition);
      } else {
        contents = `completed: ${updates.completed}\n${contents}`;
      }
    }
  }
  await fs.writeFile(logPath, contents, "utf8");
}

export function updateStateEntry(
  state: WorkState,
  phase: number,
  step: string,
  changes: Partial<Pick<StateRow, "status" | "progressLog" | "label">>
): void {
  const entry = state.find(phase, step);
  if (!entry) {
    throw new Error(`state entry ${phase}.${step} not found`);
  }
  Object.assign(entry, changes);
}

export async function writeState(statePath: string, state: WorkState): Promise<void> {
  const lines = [
    "| Phase | Step | Label | Status | Progress Log |",
    "| ----- | ---- | ----- | ------ | ------------ |",
    ...state.entries.map((entry) => {
      const progressLog = entry.progressLog ?? "-";
      return `| ${entry.phase} | ${entry.step} | ${entry.label} | ${entry.status} | ${progressLog} |`;
    })
  ];
  await fs.writeFile(statePath, `${lines.join("\n")}\n`, "utf8");
}

export function ensurePlanStateConsistency(plan: WorkPlan, state: WorkState): void {
  const planMap = new Map<string, PlanStep>();
  for (const step of plan.steps) {
    const key = buildStepKey(step);
    if (planMap.has(key)) {
      throw new Error(`PLAN contains duplicate step ${key}`);
    }
    planMap.set(key, step);
  }

  const stateMap = new Map<string, StateRow>();
  for (const entry of state.entries) {
    const key = buildStepKey(entry);
    if (stateMap.has(key)) {
      throw new Error(`STATE contains duplicate entry ${key}`);
    }
    stateMap.set(key, entry);
  }

  for (const [key, step] of planMap.entries()) {
    const stateEntry = stateMap.get(key);
    if (!stateEntry) {
      throw new Error(`STATE.md is missing entry for plan step ${key} (${step.label})`);
    }
    if (stateEntry.label !== step.label) {
      throw new Error(
        `label mismatch for ${key}: PLAN label='${step.label}' vs STATE label='${stateEntry.label}'`
      );
    }
  }

  for (const [key, entry] of stateMap.entries()) {
    if (!planMap.has(key)) {
      throw new Error(`STATE.md contains unexpected entry ${key} (${entry.label})`);
    }
  }
}

const requiredEntries: Array<{
  name: keyof WorkNodeLayout;
  expected: "file" | "directory";
  relative: string;
}> = [
  { name: "planPath", expected: "file", relative: "PLAN.md" },
  { name: "statePath", expected: "file", relative: "STATE.md" },
  { name: "logsDir", expected: "directory", relative: "logs" }
];

export async function validateWorkNodeLayout(root: string): Promise<WorkNodeLayout> {
  const normalizedRoot = path.resolve(root);
  const layout: WorkNodeLayout = {
    root: normalizedRoot,
    planPath: path.join(normalizedRoot, "PLAN.md"),
    statePath: path.join(normalizedRoot, "STATE.md"),
    logsDir: path.join(normalizedRoot, "logs")
  };

  const failures: string[] = [];
  await Promise.all(
    requiredEntries.map(async (entry) => {
      const candidate = layout[entry.name];
      try {
        const stat = await fs.stat(candidate);
        if (entry.expected === "file" && !stat.isFile()) {
          failures.push(`${entry.relative} exists but is not a file`);
        } else if (entry.expected === "directory" && !stat.isDirectory()) {
          failures.push(`${entry.relative} exists but is not a directory`);
        }
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === "ENOENT") {
          failures.push(`${entry.relative} was not found under ${normalizedRoot}`);
        } else {
          failures.push(`failed to stat ${entry.relative}: ${(error as Error).message}`);
        }
      }
    })
  );

  if (failures.length) {
    throw new Error(`WorkNode layout validation failed:\n- ${failures.join("\n- ")}`);
  }

  return layout;
}

export function validateWorkNodeLayoutSync(root: string): WorkNodeLayout {
  const normalizedRoot = path.resolve(root);
  const layout: WorkNodeLayout = {
    root: normalizedRoot,
    planPath: path.join(normalizedRoot, "PLAN.md"),
    statePath: path.join(normalizedRoot, "STATE.md"),
    logsDir: path.join(normalizedRoot, "logs")
  };

  const failures: string[] = [];
  for (const entry of requiredEntries) {
    const candidate = layout[entry.name];
    try {
      const stat = statSync(candidate);
      if (entry.expected === "file" && !stat.isFile()) {
        failures.push(`${entry.relative} exists but is not a file`);
      } else if (entry.expected === "directory" && !stat.isDirectory()) {
        failures.push(`${entry.relative} exists but is not a directory`);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        failures.push(`${entry.relative} was not found under ${normalizedRoot}`);
      } else {
        failures.push(`failed to stat ${entry.relative}: ${(error as Error).message}`);
      }
    }
  }

  if (failures.length) {
    throw new Error(`WorkNode layout validation failed:\n- ${failures.join("\n- ")}`);
  }

  return layout;
}

const IGNORED_DIRECTORY_NAMES = new Set([".git", ".github", "node_modules", "dist", "coverage", "logs"]);

async function safeReadDir(dir: string): Promise<Dirent[]> {
  try {
    return await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
}

async function scanForWorkNodes(
  dir: string,
  discovered: Map<string, WorkNodeLayout>,
  visited: Set<string>
): Promise<void> {
  const normalized = path.resolve(dir);
  if (visited.has(normalized)) {
    return;
  }
  visited.add(normalized);

  try {
    const layout = await validateWorkNodeLayout(normalized);
    if (!discovered.has(normalized)) {
      discovered.set(normalized, layout);
    }
  } catch {
    // ignore directories that are not WorkNodes
  }

  const entries = await safeReadDir(normalized);
  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }
    if (IGNORED_DIRECTORY_NAMES.has(entry.name)) {
      continue;
    }
    await scanForWorkNodes(path.join(normalized, entry.name), discovered, visited);
  }
}

export async function discoverWorkNodes(root: string): Promise<WorkNodeLayout[]> {
  const normalizedRoot = path.resolve(root);
  const discovered = new Map<string, WorkNodeLayout>();
  await scanForWorkNodes(normalizedRoot, discovered, new Set());
  return Array.from(discovered.values()).sort((a, b) => a.root.localeCompare(b.root));
}

export interface WorkNodeRelation {
  layout: WorkNodeLayout;
  parent: WorkNodeLayout | null;
  children: WorkNodeLayout[];
}

function isAncestor(ancestor: string, descendant: string): boolean {
  const relative = path.relative(ancestor, descendant);
  if (!relative || relative === "") {
    return false;
  }
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return false;
  }
  return true;
}

export function buildWorkNodeRelations(nodes: WorkNodeLayout[]): WorkNodeRelation[] {
  const sorted = [...nodes].sort((a, b) => a.root.localeCompare(b.root));
  const relations: WorkNodeRelation[] = sorted.map((layout) => ({
    layout,
    parent: null,
    children: []
  }));

  for (const relation of relations) {
    const candidates = relations.filter(
      (candidate) => candidate !== relation && isAncestor(candidate.layout.root, relation.layout.root)
    );
    if (!candidates.length) {
      continue;
    }
    candidates.sort((a, b) => b.layout.root.length - a.layout.root.length);
    const parent = candidates[0];
    relation.parent = parent.layout;
    parent.children.push(relation.layout);
  }

  return relations;
}

export async function loadWorkNode(root: string): Promise<WorkNodeSchema> {
  const layout = await validateWorkNodeLayout(root);
  const plan = await parsePlan(layout.planPath);
  const state = await parseState(layout.statePath);
  ensurePlanStateConsistency(plan, state);
  return new WorkNodeSchema(layout, plan, state);
}

export function loadWorkNodeSync(root: string): WorkNodeSchema {
  const layout = validateWorkNodeLayoutSync(root);
  const plan = parsePlanSync(layout.planPath);
  const state = parseStateSync(layout.statePath);
  ensurePlanStateConsistency(plan, state);
  return new WorkNodeSchema(layout, plan, state);
}
