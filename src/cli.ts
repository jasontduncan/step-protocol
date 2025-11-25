import path from "node:path";
import { WorkNode } from "./work-node.js";
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

async function handleCommand(command: Command, args: string[]): Promise<void> {
  switch (command) {
    case "init":
    case "run":
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
