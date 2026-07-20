# STEP — Structured Task Execution Protocol

STEP is a small, filesystem-native protocol for durable work across agents,
humans, tools, and execution sessions.

A STEP `WorkNode` keeps three things separate:

- `PLAN.md` — intended work and stable step identity
- `STATE.md` — current execution state
- `logs/` — per-step evidence and outcomes

The active conversation, model, runner, branch, or process may disappear. The
WorkNode remains available for inspection, resumption, and handoff.

[`PROTOCOL.md`](PROTOCOL.md) is authoritative. [`examples/`](examples/) contains
an unstarted WorkNode and an illustrative cross-session handoff.
[`applications/`](applications/) maps STEP to long-running agents, deep
research, and human-agent handoff without extending the protocol.

STEP is pre-1.0. A private production-scale development corpus has exercised it
across more than 2,200 current step records, including recovery after context
compaction, runner and test failures, blocked work, branch divergence, and
worktree reconciliation. The corpus has no current users, is not public, and is
not independent evidence of universal conformance.

[`RFC-0001.md`](RFC-0001.md) turns the ambiguities found in that history into a
compact proposal for hardening STEP Core before 1.0. The RFC is non-normative.

There is no canonical implementation. Implementations may use any language,
agent, toolchain, or isolation strategy that preserves STEP's semantics. STEP
does not define models, prompts, tool transport, distributed scheduling,
process checkpoints, or automatic routing between WorkNodes.

The first STEP interpreter was generated using STEP. Originally exposed as
`worktree`, it selected actionable work and managed WorkNode state. Its
historical WorkNode remains under [`provenance/`](provenance/); the
implementation is evidence, not protocol authority.
