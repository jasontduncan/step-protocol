# WORK PROTOCOL

This document defines how human and LLM workers operate on this repository.

It is **global**: it applies to all WorkNodes in the WorkTree.
All nodes must follow these rules unless explicitly granted an exception
in their own PLAN.

---

# 1. Core Concepts

### 1.1 WorkNode

A **WorkNode** is any directory that contains:

* `PLAN.md`
* `STATE.md`
* `logs/` (may be empty until used)

A WorkNode is a self-contained unit of work with:

* a roadmap (`PLAN.md`),
* a progress table (`STATE.md`),
* and per-step execution logs (`logs/*.md`).

The **meta-node** for the repository lives at:

```
docs/work/
```

This directory acts as both a WorkNode and the holder of this global protocol.

---

# 2. File Semantics

## 2.1 PLAN.md

`PLAN.md` describes **the work to be performed** for this WorkNode.

* It must define steps using the format:

  ```
  - Step P.S: <Label>
      <optional description or bullet list>
  ```

  Where:

  * `P` = phase number (integer)
  * `S` = step number (integer or dotted, e.g., `2.3`)
  * `Label` = stable text identifier

* `PLAN.md` may also describe relationships to other nodes
  (e.g., “implementation occurs under services/kia/docs/work/”),
  but these are *informational*—PROTOCOL does not route automatically.

PLAN is **not** allowed to redefine WorkTree global rules.
Those exist only in WORK_PROTOCOL.md.

---

## 2.2 STATE.md

`STATE.md` describes the **current status of each step** in a WorkNode.

It must contain a table:

```markdown
| Phase | Step | Label | Status | Progress Log |
| ----- | ---- | ----- | ------ | ------------ |
```

Rules:

* `Phase`, `Step`, and `Label` must match those in PLAN.md exactly.
* `Status` ∈ `{todo, in-progress, blocked, done, superseded}`
* `Progress Log` is either:

  * `-` (no log yet)
  * `logs/p<P>-s<S>.md` (relative to NODE_ROOT)

Exactly **one** step may be `in-progress` at a time.

---

## 2.3 logs/

Every step with `in-progress`, `done`, or `superseded` status must have a log file:

```
logs/p<phase>-s<step>.md
```

Log file template:

```markdown
# Phase P – Step S: <Label>
status: in-progress
started: 2025-00-00T00:00:00Z

## Scope
<Short description copied or adapted from PLAN.md for this step.>

## Plan
- [ ] Subtask description…
- [ ] …

## Notes
- YYYY-MM-DDTHH:MM:SSZ Description of an action taken.

## Outcomes
(Filled when status becomes done)
```

When complete:

* Mark all tasks `[x]`
* Add `completed: <ISO timestamp>`
* Fill `## Outcomes`
* Update `STATE.md` status → `done`

Logs are **append-only** except for:

* status fixes
* timestamp additions
* expanding/finishing plan/notes/outcomes

---

# 3. Node Bootstrap

If `PLAN.md` exists and `STATE.md` does **not**:

1. Parse all steps from PLAN.
2. Create `STATE.md` with one row per step:

   * `Status = todo`
   * `Progress Log = -`
3. Save and stop.

This is the only time STATE is auto-generated.

Workers must never regenerate STATE once it exists.

---

# 4. PLAN–STATE Consistency (Strong Invariant)

Once STATE.md exists:

1. **Every PLAN step must appear in STATE.**
2. **STATE must not contain steps absent in PLAN.**
3. **Step identifiers (P.S) must never change.**
4. **Step identifiers must never be reused for different work.**
5. **Removing or renaming completed steps is forbidden.**

### Allowed modifications:

| Step status           | Allowed changes                       | Forbidden changes                       |
| --------------------- | ------------------------------------- | --------------------------------------- |
| `todo`                | Clarify label/description             | Change identifier, delete if logs exist |
| `in-progress`         | Clarify label with explanation in log | Change identifier                       |
| `done` / `superseded` | Add annotations only                  | Change semantics, delete, rename, re-ID |

### Adding steps:

* Append new steps in PLAN under existing or new phases.
* Add corresponding rows to STATE (`todo`, `Progress Log = -`).

### Removing steps:

* Only steps that are still `todo` may be removed, and only via explicit maintenance steps.
* Steps with logs or progress must be `superseded`, not removed.

### Logs:

* Log files may be renamed only if the step ID changes *as part of a documented maintenance step*.
* Log contents may grow, but history must not be erased.

---

# 5. Step Selection

When implementing a WorkNode:

1. If any step has `Status = in-progress`, select it.
2. Otherwise, select the lexicographically earliest:

   * `Phase`
   * then `Step`
   * where `Status = todo`
3. If no actionable steps remain:

   * Return: “No work remaining for this WorkNode.”

This protocol guarantees deterministic progress.

---

# 6. Execution Algorithm

For a single run, acting on a single WorkNode (`NODE_ROOT`):

1. Read this protocol (`WORK_PROTOCOL.md`).
2. Read `NODE_ROOT/PLAN.md` and `NODE_ROOT/STATE.md`.
3. Select the next actionable step (see §5).
4. Create or load the log file for this step.
5. Ensure `status: in-progress` in log and STATE.
6. Expand or refine the `## Plan` subtasks as needed.
7. Perform the work described in the step:

   * Make code/doc/config changes under relevant directories.
   * After each atomic action, append a timestamped entry to `## Notes`.
8. If step is complete:

   * Check all checklist items `[x]`
   * Add `completed:` timestamp
   * Fill `## Outcomes`
   * Update `STATE.md` → `done`
9. Save all modified files.
10. Stop after finishing exactly one step.
11. Return: brief description + “Done.”

Implementers must not start a second step in the same run.

---

# 7. Multi-Node Projects and Delegation

* PROTOCOL does not decide which node a feature belongs to.
* PLANs at various nodes may refer to each other.
* A planner agent or human chooses `NODE_ROOT` for each run.
* New features may require:

  * updating multiple WorkNodes,
  * or adding child WorkNodes.

Workers must not:

* guess routing based on natural language,
* create new WorkNodes unless PLAN explicitly instructs it.

---

# 8. Runner Responsibilities

Runners (human or orchestrator) control which node is worked on.

To run work on a given node:

```
Open docs/work/WORK_PROTOCOL.md and follow it as the Work Protocol.
Treat NODE_ROOT = <path-to-node>/docs/work/.
Execute the next actionable step in NODE_ROOT/STATE.md.
```

Runners must ensure:

* Only one implementer works on a node at a time.
* Nodes are invoked intentionally.
* Audit tools are run periodically.

---

# 9. Audit Behavior (Optional but Recommended)

Audits check:

* Required files exist (PLAN, STATE, logs/)
* PLAN–STATE consistency
* Allowed vs. forbidden mutations
* Log structure and timestamps
* Identity invariants
* Multi-node references

Audits must fail fast if any violation is detected.

---

# 10. Summary

This protocol guarantees:

* deterministic progress
* crash-safe mutation
* immutable history
* clear routing
* recursive WorkNodes with stable identities
* predictable behavior from humans and large language models

