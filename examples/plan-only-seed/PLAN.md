# Plan-only WorkNode seed

This directory intentionally contains only `PLAN.md`. When this directory is
bound as `NODE_ROOT`, STEP bootstrap creates `logs/` and `STATE.md`, then
stops without beginning the step below.

- Step seed.1: Confirm the initialized WorkNode
    On the first execution run after bootstrap, verify that STATE contains this
    step as `todo`, that the step log is created only when work begins, and
    record the result.
