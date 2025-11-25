# WorkTree Meta-Node – PLAN

This plan describes the WorkTree system itself:
- What a WorkNode is.
- How WorkNodes are discovered, validated, and executed.
- How the CLI and runner behave.
- How audits are performed.

All other WorkNodes in this repository must conform to the rules defined here.

---

## Phase 0 – Define the WorkNode model

- Step 0.1: Define WorkNode schema
  - Specify the file layout for a WorkNode (PLAN, STATE, logs).
  - Define allowed statuses, step identifiers, and log filename conventions.
  - Define the minimal required sections for logs.

- Step 0.2: Define WorkNode discovery rules
  - Define how to detect a WorkNode in a filesystem tree.
  - Define how to represent WorkNodes in memory (data structures).
  - Define how to relate parent/child WorkNodes.

- Step 0.3: Define execution protocol
  - Specify how a runner selects the “next step” for a WorkNode.
  - Define step lifecycle (todo → in-progress → done/blocked/superseded).
  - Define how logs are created and updated during execution.

---

## Phase 1 – Core library (Node.js)

- Step 1.1: Implement WorkNode parser
  - Implement functions to load and parse PLAN.md and STATE.md.
  - Parse the step table into structured objects with validation.
  - Validate consistency between PLAN and STATE (IDs, labels, statuses).

- Step 1.2: Implement WorkNode model and discovery
  - Implement a WorkNode class or equivalent.
  - Implement recursive discovery of WorkNodes from a root path.
  - Represent parent/child relationships of WorkNodes.

- Step 1.3: Implement execution protocol helpers
  - Implement helpers to find the next actionable step in STATE.md.
  - Implement helpers to update STATE.md and create/update log files.
  - Ensure all mutations are idempotent and crash-safe (no partial corruption).

---

## Phase 2 – Runner and CLI

- Step 2.1: Implement CLI scaffolding (`worktree` command)
  - Create a CLI entry point (e.g., `bin/worktree`).
  - Add basic subcommands: `init`, `run`, `audit`, `status`.
  - Wire argument parsing and help output.

- Step 2.2: Implement `worktree run`
  - Implement “runner” behavior:
    - Load the root WorkNode (the meta-node at `work/`).
    - Select the next `todo` or `in-progress` step according to the protocol.
    - Print clear instructions for an external agent (human or LLM) describing the step and its scope.
    - Update STATE and logs when the step is marked done.

- Step 2.3: Implement `worktree init`
  - Implement initialization of a new WorkNode in the current directory.
  - Generate a minimal PLAN.md and STATE.md for a leaf project.
  - Record the initialization in the meta-node logs.

---

## Phase 3 – Audit and validation

- Step 3.1: Implement WorkNode validator
  - Implement a validator that checks:
    - Required files exist (PLAN, STATE).
    - STATE table structure is valid.
    - PLAN and STATE agree on step IDs and labels.
    - Logs (if present) follow naming and content conventions.

- Step 3.2: Implement `worktree audit`
  - Implement a CLI command to:
    - Run validation on the meta-node.
    - Recursively validate all discovered WorkNodes.
    - Summarize errors and exit non-zero if any violations are found.

---

## Phase 4 – Reference example and documentation

- Step 4.1: Create example leaf WorkNode
  - Create a `examples/hello-worknode/` directory.
  - Initialize it as a WorkNode using `worktree init`.
  - Author a small, self-contained PLAN for a demo project.

- Step 4.2: Write README and basic documentation
  - Explain what a WorkNode is in practical terms.
  - Show how to run `worktree run` and `worktree audit`.
  - Describe how to integrate the system into an existing repo.

---

## Phase 5 – Meta-consistency

- Step 5.1: Ensure WorkTree conforms to its own rules
  - Use `worktree audit` to validate the meta-node itself.
  - Fix any inconsistencies in PLAN, STATE, or logs.
  - Document any deliberate exceptions or extensions to the rules.

