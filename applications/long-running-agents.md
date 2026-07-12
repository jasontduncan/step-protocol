# Long-Running Agents

Long-running agents fail when intent, execution state, evidence, and unresolved work exist only inside the current model context. Durable execution must survive context loss, process restarts, tool failures, handoffs, and multiple sessions.

In a STEP WorkNode:

- `PLAN.md` records intended work, boundaries, and completion criteria.
- `STATE.md` records what is active, blocked, complete, or available next.
- `logs/` preserve material actions, observations, failures, and outcomes.

Stable step identities let execution resume without reconstructing the previous conversation. Deterministic selection lets a new session identify the same next action from persistent state.

Validation distinguishes attempted work from completed work. A step is done only when its recorded outcome satisfies the plan.

Another human or agent can resume by reading the WorkNode rather than recovering hidden conversational context.

STEP specifies this representation in [`PROTOCOL.md`](../PROTOCOL.md).
