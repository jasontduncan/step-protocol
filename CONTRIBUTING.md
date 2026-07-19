# Contributing to STEP

STEP is a small protocol. Contributions should make its semantics clearer,
more portable, or more falsifiable without turning one implementation's
behavior into a universal requirement by accident.

## Good contributions

- an ambiguity found while implementing the protocol
- a minimal valid or invalid WorkNode with an expected result
- a recovery, migration, or handoff case that current rules do not resolve
- an independent implementation report
- a contradiction between the protocol, an example, and a validator
- a correction to an evidence claim with reproducible support

## Change paths

Editorial corrections and non-normative examples may use an ordinary pull
request. A change to required files, lifecycle states, selection, identity,
mutation, compatibility, or conformance semantics should begin as an RFC under
`rfcs/`.

An RFC should state:

1. the observed problem;
2. the proposed semantics;
3. compatibility consequences;
4. conformance cases;
5. rejected alternatives;
6. unresolved questions.

An RFC is not normative merely because it is merged. `PROTOCOL.md` remains the
authority until an accepted proposal updates it explicitly.

## Evidence claims

Evidence must identify its source class, observation method, snapshot or time
boundary, and limitations. Internal audits must say that they are internal.
Private evidence may be summarized, but unverifiable details must not be
presented as independent certification.

Do not include secrets, customer data, private source code, credentials, or
security-sensitive architecture in an issue or pull request.

## Pull request checklist

- [ ] Normative and non-normative material are clearly labeled.
- [ ] Existing WorkNodes and implementations have a stated compatibility path.
- [ ] New rules have positive and negative conformance cases.
- [ ] Examples do not silently define protocol behavior.
- [ ] Claims are narrower than the evidence supporting them.
