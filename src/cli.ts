import path from "node:path";
import {
  WorkNode,
  updateStateEntry,
  auditWorkNodes,
  validateWorkNodeLayout
} from "./work-node.js";
import type { WorkNodeLayout } from "./work-node.js";
import pkg from "../package.json" with { type: "json" };

const AVAILABLE_COMMANDS = ["init", "run", "audit", "status"] as const;

type Command = (typeof AVAILABLE_COMMANDS)[number];

function printHelp(): void {
  const commands = AVAILABLE_COMMANDS.map((cmd) => `  ${cmd}`).join("\n");
  console.log(`worktree ${pkg.version}`);
  console.log(`\nUsage: worktree <command> [options]`);
  console.log(`\nCommands:`);
  console.log(commands);
  console.log(`\nUse 'worktree <command> --help' for command-specific details (not implemented yet).`);
}

function printVersion(): void {
  console.log(pkg.version);
}

function parseCommand(arg?: string): Command | undefined {
  if (!arg) {
    return undefined;
  }
  const normalized = arg.toLowerCase();
  if (normalized === "--help" || normalized === "-h") {
    return undefined;
  }
  if (normalized === "--version" || normalized === "-v") {
    return undefined;
  }
  if (AVAILABLE_COMMANDS.includes(normalized as Command)) {
    return normalized as Command;
  }
  return undefined;
}

function extractTargetOption(args: string[], defaultTarget: string): string {
  let target = defaultTarget;
  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === "--target" || arg === "--node") {
      const value = args[i + 1];
      if (!value) {
        throw new Error(`Missing value after ${arg}`);
      }
      target = path.resolve(value);
      i += 1;
    }
  }
  return target;
}

const META_NODE_ROOT = path.resolve("docs/work");

type RunOptions = {
  target: string;
  complete: boolean;
};

function parseRunOptions(args: string[]): RunOptions {
  const options: RunOptions = {
    target: process.cwd(),
    complete: false
  };

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    switch (arg) {
      case "--complete":
        options.complete = true;
        break;
      case "--target":
      case "--node": {
        const value = args[i + 1];
        if (!value || value.startsWith("-")) {
          throw new Error(`Missing value after ${arg}`);
        }
        options.target = path.resolve(value);
        i += 1;
        break;
      }
      default: {
        if (arg.startsWith("-")) {
          break;
        }
        options.target = path.resolve(arg);
        break;
      }
    }
  }

  return options;
}

type InitOptions = {
  target: string;
};

function parseInitOptions(args: string[]): InitOptions {
  return {
    target: extractTargetOption(args, process.cwd())
  };
}

async function handleRun(args: string[]): Promise<void> {
  let options: RunOptions;
  try {
    options = parseRunOptions(args);
  } catch (error) {
    console.error(`Invalid arguments for run: ${(error as Error).message}`);
    return;
  }

  let layout: WorkNodeLayout;
  try {
    layout = await validateWorkNodeLayout(options.target);
  } catch (error) {
    console.error(`Invalid WorkNode root '${options.target}': ${(error as Error).message}`);
    return;
  }

  let node: WorkNode;
  try {
    node = await WorkNode.loadFromLayout(layout);
  } catch (error) {
    console.error(`Failed to load WorkNode at '${options.target}': ${(error as Error).message}`);
    return;
  }
  const actionable = node.getNextActionableStep();
  if (!actionable) {
    console.log(`No actionable steps remain under ${options.target}.`);
    return;
  }

  const planStep = node.plan.find(actionable.phase, actionable.step);
  if (!planStep) {
    throw new Error(`Plan step ${actionable.phase}.${actionable.step} not found in PLAN.md`);
  }

  const logPaths = await node.createLogForStep(planStep);
  if (actionable.status !== "in-progress") {
    updateStateEntry(node.state, actionable.phase, actionable.step, {
      status: "in-progress"
    });
  }
  await node.persistState();

  if (options.complete) {
    const completedAt = new Date().toISOString();
    await node.updateLogForStep(planStep, { status: "done", completed: completedAt });
    updateStateEntry(node.state, actionable.phase, actionable.step, { status: "done" });
    await node.persistState();
    console.log(`Step ${actionable.phase}.${actionable.step} (${actionable.label}) marked done.`);
    return;
  }

  console.log(`Next actionable step: Phase ${actionable.phase} Step ${actionable.step} – ${actionable.label}`);
  console.log(`WorkNode root: ${options.target}`);
  console.log(`Log file: ${logPaths.relative}`);
  if (planStep.details?.length) {
    console.log("Plan:");
    for (const detail of planStep.details) {
      console.log(`  - ${detail}`);
    }
  }
  console.log("Use \`worktree run --complete\` when you finish this step to mark it done.");
}

async function handleInit(args: string[]): Promise<void> {
  let options: InitOptions;
  try {
    options = parseInitOptions(args);
  } catch (error) {
    console.error(`Invalid arguments for init: ${(error as Error).message}`);
    return;
  }

  try {
    await WorkNode.initialize(options.target);
    console.log(`Initialized a new WorkNode at ${options.target}`);
    console.log("Run `worktree run` inside that directory to begin the first step.");
  } catch (error) {
    console.error(`Failed to initialize WorkNode: ${(error as Error).message}`);
  }
}

async function handleAudit(args: string[]): Promise<void> {
  let target: string;
  try {
    target = extractTargetOption(args, META_NODE_ROOT);
  } catch (error) {
    console.error(`Invalid arguments for audit: ${(error as Error).message}`);
    return;
  }

  const results = await auditWorkNodes(target);
  if (!results.length) {
    console.log(`No WorkNodes found under ${target}.`);
    return;
  }

  let failures = 0;
  for (const result of results) {
    if (!result.errors.length) {
      console.log(`[ok] ${result.layout.root}`);
    } else {
      failures += 1;
      console.log(`[error] ${result.layout.root}`);
      for (const error of result.errors) {
        console.log(`  - ${error}`);
      }
    }
  }

  console.log(`Audit completed: ${results.length} nodes checked.`);
  if (failures) {
    console.log(`${failures} nodes had validation errors.`);
    process.exitCode = 1;
  }
}

async function handleCommand(command: Command, args: string[]): Promise<void> {
  switch (command) {
    case "init": {
      await handleInit(args);
      break;
    }
    case "run": {
      await handleRun(args);
      break;
    }
    case "audit": {
      await handleAudit(args);
      break;
    }
    case "status": {
      console.log(`The '${command}' command is not implemented yet.`);
      console.log("Please consult the documentation under docs/work/ for the WorkTree protocol.");
      break;
    }
  }
}

export async function main(argv: string[] = process.argv.slice(2)): Promise<void> {
  if (argv.length === 0) {
    printHelp();
    return;
  }

  if (argv.includes("--help") || argv.includes("-h")) {
    printHelp();
    return;
  }

  if (argv.includes("--version") || argv.includes("-v")) {
    printVersion();
    return;
  }

  const command = parseCommand(argv[0]);
  if (!command) {
    printHelp();
    return;
  }

  await handleCommand(command, argv.slice(1));
}

if (process.argv[1]?.endsWith("cli.js")) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
