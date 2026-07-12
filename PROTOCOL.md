# STEP Protocol

Structured Task Execution Protocol (STEP) defines a filesystem representation for work shared by humans, intelligent agents, and tools.

The protocol separates durable intent from any particular implementation. A conforming runner may be a person, a script, an agent, an orchestrator, or a combination of them.

## 1. Conformance language

The terms MUST, MUST NOT, SHOULD, SHOULD NOT, and MAY describe normative requirements.

A STEP implementation conforms when it preserves the required WorkNode files, state transitions, dependency constraints, evidence, and validation behavior described here.

## 2. Work graph

A STEP workspace is a directed acyclic graph of WorkNodes, called a WorkDAG.

A WorkNode is a persistent unit of executable intent. Nodes may represent features, investigations, releases, migrations, decisions, or other bounded work.

Edges represent explicit dependencies. A runner MUST NOT infer a dependency solely from directory layout or natural-language similarity. If dependency metadata is absent, a runner may execute only according to the ordering declared inside the selected node.

The protocol does not require a single repository, programming language, agent, or execution environment.

## 3. WorkNode layout

A WorkNode is a directory containing:

```text
PLAN.md
STATE.md
logs/
```

`PLAN.md` defines intended work. `STATE.md` records current execution state. `logs/` preserves evidence produced while performing the work.

Additional files MAY exist, but runners MUST treat these three artifacts as the node's protocol surface.

## 4. PLAN.md

A plan describes scope, steps, dependencies, and completion criteria.

Each step MUST have a stable identifier and label:

```markdown
- Step 2.1: Validate the migration
  - Depends on: `../prepare#1.3`
  - Run the migration against a representative copy.
  - Record the validation result and any exceptions.
```

The identifier has the form `P.S`, where `P` is a phase number and `S` is a numeric or dotted step number.

Step identifiers MUST NOT be reused for different work. After execution begins, identifiers and meanings MUST remain stable. Clarifications may be appended, but completed history must not be rewritten.

A dependency target SHOULD use the form `<node-path>#<step-id>`. A node path without a step identifies completion of the entire node. Implementations MAY support an equivalent structured representation, provided it is persistent and inspectable.

The descriptive bullets under a step define its work and completion criteria. A runner MUST have enough criteria to validate completion before marking the step done. If the criteria are insufficient, the step SHOULD be blocked or clarified rather than guessed.

## 5. STATE.md

State is represented as a table:

```markdown
| Phase | Step | Label | Status | Progress Log |
| ----- | ---- | ----- | ------ | ------------ |
| 2 | 2.1 | Validate the migration | todo | - |
```

`Phase`, `Step`, and `Label` MUST correspond to the plan.

Allowed statuses are:

- `todo` — eligible when its dependencies are satisfied
- `in-progress` — currently being executed
- `blocked` — unable to proceed; the reason must be recorded
- `done` — completion criteria have been validated
- `superseded` — intentionally replaced or made unnecessary

A node SHOULD have no more than one `in-progress` step unless its execution profile explicitly permits safe parallelism.

The progress log is `-` before execution or a relative path such as `logs/p2-s2.1.md`.

## 6. Logs and evidence

Every step that reaches `in-progress`, `blocked`, `done`, or `superseded` MUST have a log.

The canonical filename is:

```text
logs/p<phase>-s<step>.md
```

A log SHOULD contain:

```markdown
# Phase 2 - Step 2.1: Validate the migration
status: in-progress
started: 2026-01-01T00:00:00Z

## Scope

## Plan

## Notes

## Outcomes
```

Logs are append-only execution evidence. Corrections MAY clarify metadata, but implementations MUST NOT erase material actions, decisions, failures, or results.

A completed log MUST record its completion time, outcomes, and the evidence used to validate the step. A blocked log MUST record the blocking condition and what would allow execution to resume.

## 7. Consistency invariants

Once `STATE.md` exists:

1. Every plan step MUST have exactly one state row.
2. State MUST NOT contain steps absent from the plan.
3. Step identifiers and labels MUST agree between plan and state.
4. Every referenced log MUST exist inside the node.
5. A log filename MUST identify the step it documents.
6. A `done` step MUST have recorded outcomes and validation evidence.
7. A step MUST NOT begin until its declared dependencies are satisfied.
8. Executed steps MUST be superseded rather than deleted.

New work is added by appending plan steps and matching `todo` rows. A `todo` step with no execution evidence MAY be removed through an explicit maintenance action.

## 8. Bootstrap

If `PLAN.md` exists and `STATE.md` does not, a runner MAY bootstrap the node by:

1. Parsing all plan steps.
2. Creating one matching `todo` state row per step.
3. Setting each progress log to `-`.
4. Creating `logs/` if necessary.
5. Saving the new state atomically.
6. Stopping without beginning execution.

A runner MUST NOT overwrite an existing state during bootstrap.

## 9. Step selection

For a selected WorkNode, a runner determines the next action as follows:

1. Resume the existing `in-progress` step, if one exists.
2. Otherwise select a `todo` step whose dependencies are satisfied.
3. Order eligible steps by phase and then by numeric step identifier.
4. If no step is eligible, report whether the node is complete or blocked.

Selection MUST be deterministic for the same recorded graph and state.

## 10. Execution lifecycle

A runner executing one step SHOULD:

1. Read this protocol and the selected node's plan and state.
2. Validate the node before mutation.
3. Select the next actionable step.
4. Create or load its log.
5. Record `in-progress` in the log and state.
6. Perform the planned work while appending material actions and observations.
7. Validate the completion criteria.
8. Record outcomes and validation evidence.
9. Atomically update the log and state to `done`, `blocked`, or `superseded`.
10. Stop at the configured execution boundary.

The default execution boundary is one step. A runner MAY execute multiple steps only when it preserves dependency ordering, evidence, validation, isolation, and recoverability.

## 11. Handoff and resumption

A WorkNode must be resumable from its persistent artifacts.

A new participant SHOULD be able to determine:

- what the node intends to accomplish
- which dependencies govern it
- what has already happened
- what is currently in progress or blocked
- what evidence supports completed work
- what action is eligible next

Unrecorded conversational context MUST NOT be required to interpret the node correctly.

## 12. Isolation and concurrency

STEP does not mandate an isolation technology. A runner MAY use Git worktrees, branches, containers, virtual machines, sandboxes, or other mechanisms.

When concurrent work could interfere, the runner MUST isolate execution or serialize it. It MUST prevent two participants from mutating the same WorkNode state simultaneously.

Changes produced in isolation MUST be reconciled with the persistent WorkNode artifacts before they are considered complete.

## 13. Validation

Validation is part of execution, not an optional report after it.

A conforming runner MUST validate:

- required layout and parseable files
- plan/state consistency
- legal status values and transitions
- dependency satisfaction
- referenced logs and required metadata
- completion criteria and recorded evidence
- safe persistence of mutations

Domain-specific validation MAY include tests, builds, review, measurements, approvals, or external observations. The plan determines what evidence is sufficient.

A runner MUST NOT mark a step done merely because an action was attempted.

## 14. Runner responsibilities

A runner interprets the protocol; it does not own the intent.

A runner MUST:

- operate on an explicitly selected node
- preserve stable identities and history
- respect dependencies and execution boundaries
- make state changes inspectable
- fail clearly when invariants are violated
- avoid inventing missing routing or completion criteria
- leave enough evidence for another participant to resume

A runner MAY plan, delegate, invoke tools or agents, manage isolated environments, and coordinate multiple nodes, provided those behaviors preserve the protocol.

## 15. Extensions

Implementations MAY add structured metadata, richer dependency forms, signatures, policies, permissions, or orchestration controls.

Extensions MUST NOT silently weaken the core invariants. Portable WorkNodes SHOULD remain understandable from their Markdown artifacts without requiring a proprietary service.

## 16. Summary

STEP makes intent, state, dependencies, evidence, and validation persistent. It provides a shared execution surface on which different humans, agents, tools, and runners can cooperate without making any one implementation canonical.
