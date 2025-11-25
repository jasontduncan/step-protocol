# WorkTree Example and Protocol Guide

This repository demonstrates the WorkTree meta-node and CLI described in `docs/work/WORK_PROTOCOL.md`. It ships both the engine (in `src/`) and a CLI scaffold (`bin/worktree`) together with:

- **Core behavior**: PLAN/STATE parsing, discovery, logs, and mutation helpers under `src/work-node.ts`.
- **CLI commands**: `worktree init`, `run`, and `audit` that orchestrate nodes per the protocol.
- **Example nodes**: `docs/work/` acts as the meta-node and `examples/hello-worknode/` shows a leaf node initialized via the CLI.

## Getting started
1. **Initialize a WorkNode** - Run `npx worktree init` (or `node dist/cli.js init` in this repository) to bootstrap PLAN.md, STATE.md, and `logs/`. Use `--target <path>` to place nodes elsewhere. The CLI prevents overwriting existing nodes.
2. **Run work** - Use `worktree run` to load the next actionable step. The command prints the phase/step label, plan bullets, and the log path, then creates/updates the per-step log and marks state as `in-progress`. Add `--complete` once the task is done to update the log header and mark the state row as `done` in one go.
3. **Audit** - Execute `worktree audit` to walk every discovered WorkNode, run the validator, and report `[ok]`/`[error]` per node. The command sets a failure exit code when any violation exists so CI pipelines can guard protocol compliance.

## Recommended layouts
- Keep a **meta-node** (like this repo's `docs/work/`) with its own PLAN/STATE/logs to track global work and audit other nodes.
- Create child nodes in subdirectories (`examples/`, `services/`, etc.) using `worktree init`. Each node manages its own PLAN/STATE/logs and can reference its parent node in documentation if needed.
- Let the meta-node refer to critical child nodes in its PLAN or docs, but rely on `worktree audit` for validation rather than manually syncing their STATE tables.

## Development
- `npm run build` compiles the TypeScript sources into `dist/` for consumption by `bin/worktree`.
- `npm test` can be extended to cover parser, validator, and CLI behaviors once tests are defined.

This README complements `docs/work/WORK_PROTOCOL.md`, which defines the invariant that every node must enforce.
