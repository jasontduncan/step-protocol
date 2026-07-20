# Examples

`hello-worknode/` is a minimal STEP WorkNode. It demonstrates the required `PLAN.md` and `STATE.md` relationship using a semantic phase identifier and a locally ordered step.

The example has not begun execution, so it has no progress log. An implementation would create `logs/phello-worknode-shello-worknode.1.md` when the step enters `in-progress`.

`resumable-handoff/` is a completed, illustrative WorkNode. Its README shows the state seen before an interruption and the final state after a fresh worker resumed from durable artifacts.
