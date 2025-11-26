# STEP — Structured Task Execution Protocol

STEP is a deterministic protocol for structuring work across humans and LLMs.

It represents work as a WorkDAG of **WorkNodes**, where each node has:

* `PLAN.md` — the roadmap of steps
* `STATE.md` — the current status of each step
* `logs/` — append-only per-step execution logs

This repo contains:

* The STEP protocol (see `docs/work/WORK_PROTOCOL.md`)
* The meta-node PLAN and STATE for STEP itself
* A Node.js/TypeScript reference implementation of the WorkDAG engine
* A CLI runner currently exposed as the `worktree` command
* An example WorkNode under `examples/hello-worknode/`

> Note: The binary is still named `worktree` in v0.1. Future versions may rename
> the CLI to align with STEP/WorkDAG, but the protocol and file semantics are stable.

## Usage (very short)

From the repo root, after installing dependencies:

```bash
npm install
npx ts-node src/cli.ts --help
# or, if bin/worktree.js is already compiled and executable:
./bin/worktree.js --help
```

To run the meta-node (the STEP definition itself):

```bash
./bin/worktree.js run docs/work
```

To initialize a new WorkNode in the current directory:

```bash
./bin/worktree.js init
```

## Status

This is a **v0.1** reference implementation. The protocol is usable, but the CLI
and APIs are still evolving. Expect breaking changes.

Contributions, issues, and discussion are welcome.

