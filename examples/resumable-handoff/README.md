# Resumable handoff example

This non-normative example illustrates one step crossing a session boundary.
The checked-in WorkNode represents the final state. The intermediate table below
shows what a fresh worker would have found after the first session stopped.

## Before interruption

| Phase | Step | Label | Status | Progress Log |
| --- | --- | --- | --- | --- |
| continuity | continuity.1 | ContinuityReport.Publish | in-progress | logs/pcontinuity-scontinuity.1.md |

The first session had inventoried the sources and written that fact to the log,
but it stopped before drafting and verification.

## Resumption

A fresh worker reads the protocol, PLAN, STATE, and referenced log. It resumes
`continuity.1`, completes the unchecked subtasks, records verification, and
updates the log and STATE to `done`.

No conversational summary is required. The durable artifacts identify the work,
its current disposition, prior material actions, and the remaining completion
criteria.

The timestamps and outcome are illustrative; this directory is an example, not
evidence of an independently observed run.
