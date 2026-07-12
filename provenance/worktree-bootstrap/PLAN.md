# WorkTree Meta-Node – PLAN

This PLAN describes the implementation roadmap for the WorkTree system.

- Global behavior, invariants, and file semantics are defined in
  `docs/work/WORK_PROTOCOL.md`.
- This document only defines the work required to build and evolve WorkTree
  itself: libraries, CLI, audits, examples, and docs.

All other WorkNodes in this repository must conform to the protocol, but have
their own PLAN and STATE specific to their scope.

---

## Phase 0 – Core Model Foundations

Implement the minimal code needed to recognize and represent WorkNodes on disk.

- Step 0.1: Implement WorkNode schema representation
  - Define in-code data structures for a WorkNode.
  - Represent PLAN, STATE, and logs as structured objects.
  - Add validation helpers for WorkNode layout (PLAN, STATE, logs/ present).

- Step 0.2: Implement WorkNode discovery
  - Implement filesystem scanning to detect WorkNodes recursively.
  - Establish parent/child relationships between discovered nodes.
  - Provide utilities for loading a WorkNode from a given root directory.

- Step 0.3: Implement execution protocol helpers
  - Implement helpers to:
    - Parse PLAN.md and STATE.md for a WorkNode.
    - Identify the next actionable step according to the protocol.
    - Create and update log files for steps.
    - Apply status transitions and write updated STATE.md.

---

## Phase 1 – Core Library (Node.js)

Build the reusable library that other tools and CLIs will rely on.

- Step 1.1: Implement PLAN and STATE parsers
  - Parse PLAN.md into a list of step objects.
  - Parse STATE.md into a validated table model.
  - Cross-check identifiers and labels between PLAN and STATE.

- Step 1.2: Implement WorkNode class / API
  - Wrap parsing, validation, and discovery into a coherent WorkNode API.
  - Provide methods for:
    - reading and writing STATE,
    - listing steps by status,
    - locating and managing logs.

- Step 1.3: Implement crash-safe mutation helpers
  - Ensure updates to STATE and logs use atomic or temp-file writes.
  - Avoid partial writes that could corrupt PLAN, STATE, or logs.
  - Add basic error handling and reporting for file I/O failures.

---

## Phase 2 – Runner and CLI

Create the command-line interface used by humans and orchestration agents.

- Step 2.1: Implement CLI scaffolding (`worktree` command)
  - Create a CLI entry point (e.g., `bin/worktree`).
  - Implement base command framework and `--help` output.
  - Wire configuration for specifying the meta-node root if needed.

- Step 2.2: Implement `worktree run`
  - Load the target WorkNode (default: the meta-node at `docs/work/`).
  - Determine the next actionable step according to the protocol.
  - Print clear, structured instructions suitable for human or LLM workers.
  - Update STATE and logs when the step is reported as complete.

- Step 2.3: Implement `worktree init`
  - Initialize a new WorkNode in the current directory.
  - Generate minimal PLAN.md and STATE.md consistent with WORK_PROTOCOL.
  - Create an empty logs/ directory.
  - Optionally record the initialization in the meta-node logs.

---

## Phase 3 – Audit and Validation

Provide tools to ensure WorkNodes remain consistent with the protocol.

- Step 3.1: Implement WorkNode validator
  - Validate that required files exist (PLAN, STATE, logs/).
  - Validate table structure and content in STATE.md.
  - Validate PLAN–STATE consistency (IDs, labels, statuses).
  - Validate log file naming, structure, and basic timestamp rules.

- Step 3.2: Implement `worktree audit`
  - Recursively validate all WorkNodes starting at the meta-node root.
  - Summarize failures in a concise, machine- and human-readable report.
  - Exit non-zero on any violation.

---

## Phase 4 – Reference Example and Documentation

Make WorkTree understandable and demonstrable.

- Step 4.1: Create example leaf WorkNode
  - Create `examples/hello-worknode/`.
  - Initialize it using `worktree init`.
  - Author a small, self-contained PLAN.md that demonstrates typical usage.

- Step 4.2: Write documentation
  - Write a top-level README describing WorkTree in practical terms.
  - Document how to:
    - initialize a node,
    - run work (`worktree run`),
    - and audit (`worktree audit`).
  - Describe recommended project layouts for multi-node trees.

---

## Phase 5 – Meta-Consistency

Ensure WorkTree itself conforms to the rules it enforces.

- Step 5.1: Validate the meta-node against the protocol
  - Use `worktree audit` to validate the meta-node under `docs/work/`.
  - Fix any inconsistencies in PLAN, STATE, or logs.
  - Document any deliberate exceptions or extensions to the protocol.

---

## Phase 6 – Maintenance and Hardening

- Step 6.1: Fix bootstrap behavior for `worktree init`
  - Ensure `worktree init` follows WORK_PROTOCOL §3 (Node Bootstrap):
    - When PLAN.md exists and STATE.md does not, do not run the general PLAN–STATE validator.
    - Instead, parse PLAN.md and generate STATE.md with one row per step, with Status = `todo` and Progress Log = `-`.
    - Exit successfully after creating a consistent initial STATE.
  - Ensure that initialization errors are only raised for truly invalid situations (e.g., conflicting existing STATE, malformed PLAN), not for the normal bootstrap flow.

- Step 6.2: Clarify Node Bootstrap semantics in WORK_PROTOCOL
  - Update docs/work/WORK_PROTOCOL.md §3 (Node Bootstrap) to explicitly state that:
    - During bootstrap, `worktree init` MUST NOT invoke the general PLAN–STATE validator.
    - The bootstrap process itself is the source of truth for the initial PLAN–STATE consistency.
  - Optionally add a brief “Implementation Notes” subsection under §3 to describe the intended control flow for `worktree init` in concrete terms, without changing the existing rules.
  - Ensure the new text is clearly a clarification/tightening of the existing behavior, not a relaxation of any invariant.

- Step 6.3: Fix NODE_ROOT resolution in `worktree run`
  - Ensure `run` uses the same agnostic NODE_ROOT resolution as `init`:
    - If a positional path argument is given, treat that exact directory as NODE_ROOT.
    - If no argument is given, use `process.cwd()` as NODE_ROOT.
  - Remove any logic that assumes NODE_ROOT contains or must contain `docs/work/`.
  - Validate NODE_ROOT by checking for PLAN.md, STATE.md, and logs/ directly in that directory.
  - Fail with a clear error if the validation fails.
  - No layout assumptions should be encoded in the CLI; `docs/work/` is only special when explicitly passed.

- Step 6.4: Fix starter PLAN template identifier
  - Update the `worktree init` starter PLAN template so that new WorkNodes use normalized step identifiers.
  - Replace the incorrect “Step 0.0.1: Document the WorkNode scope” template with the correct “Step 0.1: Document the WorkNode scope”.
  - Ensure STATE bootstrap generation remains consistent with this identifier format.
  - This step does not modify existing nodes; it only corrects the template for future `worktree init` executions.
