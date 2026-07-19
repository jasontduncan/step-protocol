# RFC 0001: STEP Core hardening from production evidence

- Status: Draft
- Created: 2026-07-19
- Target: pre-1.0 clarification
- Discussion: not yet opened

## Abstract

STEP has been used extensively in a private, production-scale development
corpus. That use supports the core model—stable task identity, explicit state,
and durable evidence—but also exposes ambiguity around recovery, artifact
classification, state precedence, concurrency, migration, and conformance.

This RFC proposes a hardening process rather than a single immediate rewrite.
It separates portable STEP Core semantics from optional execution profiles,
turns observed incidents into candidate conformance cases, and defines the work
required before a stable 1.0 protocol can be claimed.

This RFC is non-normative. It does not change `PROTOCOL.md`.

## Motivation

The current protocol grew from an operating work system. Its minimal artifacts
have survived long histories and multiple runner generations, but several
implementation assumptions remain implicit. A narrow historical validator, for
example, classified transcript sidecars and migrated history as malformed logs
even though the current runner could operate the WorkNodes.

The right response is neither to declare production history invalid nor to make
every production behavior part of STEP. The protocol needs a small portable
core, explicit extension points, and conformance cases that distinguish required
semantics from runner policy.

## Goals

- Make independent implementations reach the same conclusions from the same
  WorkNode.
- Preserve the minimal PLAN, STATE, and evidence model.
- Define recovery and reconciliation without requiring a particular database,
  VCS, runner, or model.
- Allow richer runners without making their policy universal.
- Provide versioned, machine-testable conformance fixtures.
- Keep existing production history recoverable through an explicit migration
  and legacy-classification path.

## Non-goals

- Standardize prompts, tools, models, transport, or process checkpoints.
- Require Git, a service, a database, or a canonical implementation.
- Add a general scheduler or dependency graph to STEP Core.
- Guarantee application correctness or business outcomes.
- Infer worker identity from Git authorship or transcript content.

## Proposed protocol layers

### STEP Core

STEP Core should own only portable semantics:

- WorkNode discovery and required artifacts
- protocol and WorkNode bindings
- stable phase, step, and label identity
- PLAN and STATE consistency
- lifecycle states and allowed transitions
- actionable-step selection
- evidence association and minimum completion evidence
- recovery and non-destructive reconciliation
- version and extension declarations
- conformance levels

### Execution profiles

Profiles may define stronger operational behavior:

- worker and runner write boundaries
- test and approval gates
- transcript capture
- finish-only recovery
- commit, branch, and worktree integration
- distributed locking or leases
- dependency routing between WorkNodes
- retention and artifact storage policy

Profiles must not weaken Core invariants. A profile must declare its identity and
version and must keep profile-specific artifacts distinguishable from canonical
Core artifacts.

## Questions requiring normative resolution

### 1. Grammar and path safety

The protocol recommends semantic phase identifiers but does not define a full
grammar or escaping model. Core needs exact identifier syntax, Unicode policy,
case sensitivity, table parsing, and safe log-path derivation.

### 2. Lifecycle transitions

Core lists five states without defining a complete transition system. It must
say which transitions are valid, whether a blocked step requires evidence, how
unblocking works, and how manual or migrated completion is represented without
fabricating runner history.

### 3. Durable versus transient state

Production Git history often records `todo -> done` because `in-progress` is
transient within one invocation. Core must decide whether `in-progress` must be
durably observable before work begins or whether a conforming atomic completion
may persist only the terminal transition.

### 4. Evidence and sidecars

Canonical step logs, detailed execution transcripts, test reports, screenshots,
and imported evidence need distinguishable locations or declared media types.
An auditor must not treat every artifact beside a log as another canonical log.

### 5. Authority and state precedence

Core must define what wins when runner status, `STATE.md`, a log header, and VCS
history disagree. Reconciliation must preserve conflicting evidence and report
uncertainty rather than silently rewriting history.

### 6. Interrupted mutation

Updating STATE and evidence is a multi-artifact operation. Core must define
detectable partial states and a recovery procedure, or narrow any claim of
crash safety to implementations that provide an atomic commit mechanism.

### 7. Selection order

Lexicographic selection is deterministic but may order `10` before `2` and
semantic phases alphabetically rather than by author intent. Core must choose
canonical PLAN order, a formally sortable identifier, or another explicit rule.

### 8. Concurrency and ownership

The current protocol delegates single-writer enforcement to the runner. Core
must define the observable precondition and conflict result. WorkNode splits and
copied history also need a way to prevent duplicate active ownership.

### 9. Migration and retained history

Legacy logs, renamed nodes, reconstructed metadata, orphaned evidence, and copied
history need classifications that preserve provenance without making all old
artifacts active protocol objects.

### 10. Versioning and extensions

Every WorkNode needs a way to declare the protocol revision and required
extensions. Implementations need deterministic behavior when they encounter an
unknown version or extension.

### 11. Trust boundary

PLAN is executable intent; logs, transcripts, tool output, and imported evidence
may contain untrusted text. Core must state that evidence cannot redefine
protocol or PLAN authority and that implementations must not execute paths or
instructions merely because they appear in evidence.

## Production-derived candidate cases

The detailed candidates live in
[`conformance/production-derived-cases.md`](../conformance/production-derived-cases.md).
They cover:

- runner-owned metadata outside a worker allowlist
- a test failure after worker success
- finish-only recovery
- reconstruction after untracked metadata loss
- context-compaction continuation
- WorkNode splitting with copied history
- semantic identifiers containing hyphens
- blocked work completed after a dependency
- stale runner status versus STATE and VCS
- transcript sidecars colocated with canonical logs
- manual completion reconciliation
- worktree merge and conflict recovery

## Proposed conformance levels

This RFC proposes three levels for discussion:

1. **Core Reader** — parses and validates a WorkNode without mutation.
2. **Core Worker** — selects and advances one step while preserving Core
   invariants and evidence.
3. **Profile Runner** — implements Core Worker plus one or more declared
   execution profiles.

No level should be claimed until a fixture set defines its expected inputs,
outputs, and failure behavior.

## Compatibility posture

Existing WorkNodes must not be rewritten merely to satisfy a later grammar.
The 1.0 path should define:

- a legacy reader mode;
- a non-destructive audit report;
- an explicit migration operation;
- provenance for every synthesized or reconstructed field;
- a rule preventing migrated history from becoming duplicate active work.

## Acceptance criteria

RFC 0001 is ready for acceptance only when:

- at least two independent readers agree on the fixture corpus;
- lifecycle and precedence tables are explicit;
- identifier and path grammars are machine-testable;
- interrupted-update recovery has a deterministic result;
- Core and profile artifacts are distinguishable;
- a migration fixture preserves legacy evidence without inventing history;
- the resumable-handoff example passes the candidate Core rules;
- security and trust-boundary requirements are documented.

## Open questions

- Should protocol version live in PLAN frontmatter, a separate manifest, or both?
- Is canonical PLAN order stable enough for selection after maintenance edits?
- Must `blocked` always have a log and a machine-readable reason?
- Does Core require timestamps, or may profiles strengthen that rule?
- Should evidence be append-only events or a mutable summary with immutable
  source records?
- What is the smallest useful dependency reference without turning Core into a
  scheduler?
