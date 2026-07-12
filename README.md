# STEP — Structured Task Execution Protocol

STEP is an agent-readable protocol for work shared by humans, LLM agents, and tools.

A STEP `WorkNode` is executable intent with persistent state and evidence:

- `PLAN.md` — intended work
- `STATE.md` — current execution state
- `logs/` — execution evidence

This repository publishes a software idea, not a software package.

[`PROTOCOL.md`](PROTOCOL.md) defines STEP and is authoritative. [`examples/hello-worknode/`](examples/hello-worknode/) is a minimal, non-normative example. [`provenance/worktree-bootstrap/`](provenance/worktree-bootstrap/) preserves the historical WorkNode that directed the early WorkTree implementation.

There is no canonical implementation. Implementations are contextual, replaceable expressions of the protocol. They may use any language, agent, toolchain, or isolation strategy that preserves STEP's semantics.

The first STEP protocol interpreter was generated using STEP. Originally exposed as `worktree`, it deterministically selects actionable work and manages WorkNode state. It remains the kernel beneath the author's current `step` application. The implementation is evidence of the protocol in use, not part of the protocol itself.

Read `PROTOCOL.md`. From it, a human or agent should be able to understand the execution model, determine what work is actionable, resume or hand off work, validate outcomes from recorded evidence, and implement an appropriate runner.

The protocol is the durable software. Implementations can be generated again.
