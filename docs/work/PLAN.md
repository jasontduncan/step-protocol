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

