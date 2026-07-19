# STEP — Structured Task Execution Protocol

STEP is a small, filesystem-native protocol for durable work state across agents, humans, tools, and execution sessions.

A STEP `WorkNode` keeps three concerns separate:

- `PLAN.md` — intended work and stable step identity
- `STATE.md` — current execution state
- `logs/` — per-step evidence and outcomes

The active conversation, model, runner, branch, or process may disappear. The WorkNode remains available for inspection, resumption, and handoff.

## Status

STEP is an open, pre-1.0 specification. It has substantial use in a private production-scale development corpus, but its conformance model and several recovery semantics are still being hardened.

[`PROTOCOL.md`](PROTOCOL.md) is the current authoritative protocol. Documents under [`rfcs/`](rfcs/) are proposals and do not change the protocol until accepted. Files under [`examples/`](examples/) and [`applications/`](applications/) are non-normative.

There is no canonical implementation. A conforming implementation may use any language, agent, toolchain, or isolation strategy that preserves STEP's semantics.

## Try the model

1. Read [`PROTOCOL.md`](PROTOCOL.md).
2. Inspect the unstarted [`hello-worknode`](examples/hello-worknode/) example.
3. Inspect the completed [`resumable-handoff`](examples/resumable-handoff/) example.
4. Point a human or agent at one WorkNode and ask it to execute exactly one actionable step under the protocol.
5. Stop the session and resume from the WorkNode rather than from conversational memory.

The useful test is not whether a worker can read Markdown. It is whether a fresh worker identifies the same work, understands the recorded state, avoids repeating accepted work, and can justify completion from evidence.

## Where STEP fits

STEP does not replace agent instructions, tool protocols, agent-to-agent transport, issue trackers, or durable execution runtimes. It defines a portable work-state boundary that those systems may read, write, validate, import, or export.

STEP deliberately does not specify:

- model or prompt architecture
- tool invocation or network transport
- distributed scheduling or locking
- process-level checkpointing
- a required database, service, or runner
- automatic routing between WorkNodes

## Evidence and hardening

An anonymized internal audit of a private, multi-application codebase found 2,218 current STEP step records across 10 WorkNodes, including recovery after context compaction, runner failures, test failures, blocked work, branch divergence, and worktree reconciliation. The audit is summarized as [`KD-2026-01`](evidence/KD-2026-01.md). It is production evidence from one development corpus, not independent certification or proof of universal conformance.

The first hardening proposal, [`RFC 0001`](rfcs/0001-step-core-hardening.md), turns ambiguities found in that corpus into explicit design questions and candidate conformance cases.

## Repository map

- [`PROTOCOL.md`](PROTOCOL.md) — current normative protocol
- [`rfcs/`](rfcs/) — proposed protocol changes
- [`conformance/`](conformance/) — conformance model and candidate cases
- [`examples/`](examples/) — non-normative WorkNodes and walkthroughs
- [`applications/`](applications/) — mappings to recognizable problem domains
- [`evidence/`](evidence/) — bounded evidence claims and methodology
- [`provenance/worktree-bootstrap/`](provenance/worktree-bootstrap/) — historical WorkNode that directed the first interpreter

The first STEP interpreter was generated using STEP. Originally exposed as `worktree`, it selected actionable work and managed WorkNode state. It remains historical implementation evidence, not part of the protocol.

## Contributing

STEP needs hostile readings, independent implementations, recovery experiments, and small reproducible failure cases more than it needs feature accumulation. See [`CONTRIBUTING.md`](CONTRIBUTING.md).
