# Production-derived conformance candidates

These candidates were reduced from an internal audit of a private,
production-scale development corpus. They describe protocol problems without
publishing product identity, source code, customer information, or private
paths. Expected results marked `RFC` require a normative decision in RFC 0001.

| Case | Minimal condition | Expected property |
| --- | --- | --- |
| Runner metadata outside worker scope | Worker edits are valid; runner must update a progress log outside the worker allowlist | Runner-owned mutation is classified separately from a worker scope breach; implementation work remains recoverable |
| Test failure after worker success | Worker reports success; an independent test fails | Step cannot finalize; evidence and completed implementation remain available for repair |
| Finish-only recovery | Implementation is complete; finalization previously failed | Runner resumes the failed boundary without launching a second implementation pass or duplicating side effects |
| Lost untracked metadata | Source commits exist; WorkNode metadata was never committed | Recoverable identity is reconstructed with provenance; irrecoverable detail is reported rather than invented |
| Context-compaction continuation | Active context disappears during one step | A fresh session selects the same step and resumes from PLAN, STATE, and evidence |
| WorkNode split with copied history | Historical rows and logs are copied to a narrower node | History remains inspectable; only one node retains active ownership of unfinished work |
| Hyphenated semantic identifiers | Phase and labels contain documented semantic punctuation | Reader parses and round-trips identity without truncation or path ambiguity |
| Blocked dependency recovery | Active work becomes blocked; a dependency is completed | Blocked interval and reason remain visible; completion does not rewrite the history as uninterrupted success |
| Stale runner status | Runner cache, STATE, log, and VCS disagree | Audit reports the conflict and follows a normative precedence rule without destructive repair |
| Transcript sidecars | Non-Markdown execution transcripts coexist with step logs | Reader distinguishes sidecars from canonical logs or rejects their location with a migration path |
| Manual completion | A human completes work outside the runner | Reconciliation records who or what asserted completion and the supporting evidence without fabricating a runner event |
| Worktree reconciliation | Isolated branches mutate related WorkNode history and are merged | Stable identity survives reconciliation; conflicts are explicit and no completed history disappears |

## Fixture construction rules

Each eventual machine-readable fixture should:

1. contain the smallest artifacts that reproduce the condition;
2. avoid names and values from the private source corpus;
3. separate STEP Core expectations from profile policy;
4. include a failure-state snapshot and a recovered snapshot where applicable;
5. identify which facts are observed and which are synthesized for minimization.
