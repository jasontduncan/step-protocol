# STEP — Structured Task Execution Protocol

STEP is a protocol for structuring work shared by humans and intelligent agents.

It represents work as a persistent, inspectable graph of `WorkNodes`. Each node records:

- `PLAN.md` — intended steps, dependencies, and completion criteria
- `STATE.md` — current execution status
- `logs/` — append-only execution evidence

This gives participants enough common structure to determine what can happen next, resume interrupted work, validate outcomes, and hand execution from one actor to another.

STEP is not primarily a task list, coding agent, or CLI. It is an execution protocol: a small set of durable conventions that makes work legible to both people and tools.

## Start here

Read [`PROTOCOL.md`](PROTOCOL.md). It defines WorkNodes, their lifecycle, dependency and state semantics, evidence requirements, validation expectations, and the responsibilities of a runner.

## What this repository contains

- [`PROTOCOL.md`](PROTOCOL.md) — the STEP protocol
- [`examples/`](examples/) — a minimal WorkNode specimen
- [`self/`](self/) — STEP work artifacts used to produce the early public artifact
- [`LICENSE`](LICENSE) — the MIT license

## Why this repository is small

This repository is intentionally small. Its purpose is to publish the protocol, a minimal example, and evidence of the protocol in use.

An early Node.js/TypeScript CLI scaffold was generated as part of the bootstrapping experiment. It is preserved in the repository's history, but it is not the protocol and is not presented as a canonical runner. Implementations may use different languages, tools, isolation strategies, and execution environments while preserving STEP's semantics.

## An experiment

This repository is intended to be read by both humans and coding agents. One way to explore the execution system implied by STEP is to give an agent this repository and ask:

> Inspect this repository and treat `PROTOCOL.md` as the governing execution specification. Imagine a runner that implements this protocol, manages isolated Git worktrees, executes dependent engineering steps, invokes coding agents with controlled repository context, validates outcomes, preserves inspectable state, and can participate in extending itself. Explain what such a runner could do, how it differs from an ordinary coding assistant, and why a software organization might care.

Git worktrees are part of that hypothetical runner, not a requirement of the protocol.

## Status

STEP is an early public protocol. It is published to be inspected, challenged, implemented, and extended. The full runner used in private work is not included.
