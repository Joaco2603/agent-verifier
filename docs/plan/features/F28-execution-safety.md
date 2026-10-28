# F28 — Execution safety

- Module: `docs/plan/modules/12-security-audit.md`
- Phase: 1
- Objective: Isolate code and limit permissions.

## Plan

This feature is required before generated code runs. It is a constraint on execution, not a later add-on. No generated program, test harness, or agent tool runs outside the limits below.

Isolation means the generated code runs in an environment that does not share the operator's credentials, the repository's secret store, or write access to the contract tree. Least privilege means the run receives only the files and commands that the task declared. Anything else is denied.

Network and file limits are explicit. The default is no network and a file allow-list for the task's paths. A check that needs a broader grant names that grant in the run record before the process starts. A grant is not implied by the prompt.

Secrets stay out of the prompt log. The log may record that a secret was present and was withheld. It does not record the secret value, a token, or a connection string.

Critical security blocks ignore the router and the score. A sandbox escape, a secret in the log, or a write outside the allow-list is a block at every score and for every model. The coding agent does not get a retry that widens permissions on its own.

## Acceptance criteria

- Generated code does not start until an isolation boundary and an allow-list are recorded.
- A process that opens a network destination or a path outside the allow-list is killed, and the run is FAIL.
- The prompt log for that run contains no secret value. A redaction marker is allowed.
- The run cannot write under `contracts/`.
- A critical security FAIL remains FAIL when a router choice or a risk score is attached to the same run.

## Evidence

- The isolation record: boundary, allow-list, network default, and the grants added before start.
- The denial or kill event for an out-of-list path or destination, when a trial exercises it.
- The prompt log, with secrets withheld, tied to the run id.
- The critical result stored apart from the score and the model id.

## Depends on

- A task that declares the paths it may touch.
- The contract tree as a path the run must not write.
- A place to store the prompt log that is not the model's context.

## Does not include

- A vulnerability scanner or an authorization-policy suite (those are separate checks).
- Contract approval itself (F29), beyond refusing writes under `contracts/`.
- The CI fail-closed rule for a finished change (F32).
- Choosing a model or pricing a call.

## Related

- `docs/plan/modules/12-security-audit.md`
- F10, F29, F32, F25
- UC-18, UC-21
