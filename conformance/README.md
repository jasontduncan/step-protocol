# STEP conformance

STEP does not yet have an authoritative conformance suite. This directory
defines the path toward one without treating a historical implementation as the
specification.

Conformance fixtures should contain:

- complete input artifacts;
- the protocol revision and required extensions;
- the expected parse or validation result;
- the selected actionable step, if any;
- the permitted mutation or expected error;
- the evidence that must remain after recovery;
- a short explanation tied to normative protocol text.

Fixtures derived from private production history must be minimized and
sanitized. Their semantics may be public even when their original names, paths,
source code, customers, and business domain are not.

[`production-derived-cases.md`](production-derived-cases.md) records candidate
cases observed in one private development corpus. They remain design inputs
until RFC 0001 resolves their expected Core behavior.
