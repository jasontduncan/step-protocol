# Human-Agent Handoff

Handoff fails when the next participant receives a summary but not the durable state behind it. Missing intent, decisions, evidence, and completion criteria force work to be reconstructed or trusted without inspection.

In a STEP WorkNode:

- `PLAN.md` preserves the shared definition of the work.
- `STATE.md` shows the exact execution position.
- `logs/` preserve what happened and the evidence supporting current status.

The outgoing participant records state instead of relying on memory. The incoming participant reads the same artifacts, resumes an in-progress step or selects the next actionable step, and validates prior outcomes without reopening every conversation.

The handoff may occur from human to agent, agent to human, or between independent agents. The persistent WorkNode remains the common execution surface.

STEP specifies this representation in [`PROTOCOL.md`](../PROTOCOL.md).
