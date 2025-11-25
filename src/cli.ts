import path from "node:path";
import { WorkNode, updateStateEntry } from "./work-node.js";
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

const DEFAULT_NODE_ROOT = path.resolve("docs/work");

type RunOptions = {
  target: string;
  complete: boolean;
};

function parseRunOptions(args: string[]): RunOptions {
  const options: RunOptions = {
    target: DEFAULT_NODE_ROOT,
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
        if (!value) {
          throw new Error(`Missing value after ${arg}`);
        }
        options.target = path.resolve(value);
        i += 1;
        break;
      }
      default:
        break;
    }
  }

  return options;
}

async function handleRun(args: string[]): Promise<void> {
  let options: RunOptions;
  try {
    options = parseRunOptions(args);
  } catch (error) {
    console.error(`Invalid arguments for run: ${(error as Error).message}`);
    return;
  }

  const node = await WorkNode.load(options.target);
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

async function handleCommand(command: Command, args: string[]): Promise<void> {
  switch (command) {
    case "run": {
      await handleRun(args);
      break;
    }
    case "init":
    case "audit":
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
