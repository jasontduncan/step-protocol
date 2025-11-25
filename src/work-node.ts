import { promises as fs, statSync, Dirent } from "node:fs";
import path from "node:path";

export type StepStatus = "todo" | "in-progress" | "blocked" | "done" | "superseded";

export interface StepIdentifier {
  phase: number;
  step: string;
  label: string;
}

export interface PlanStep extends StepIdentifier {
  description?: string;
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
  return new WorkNodeSchema(layout, new WorkPlan(), new WorkState());
}

export function loadWorkNodeSync(root: string): WorkNodeSchema {
  const layout = validateWorkNodeLayoutSync(root);
  return new WorkNodeSchema(layout, new WorkPlan(), new WorkState());
}
