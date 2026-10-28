# F07 — Code generation

- Module: `docs/plan/modules/03-code-generation.md`
- Phase: 1
- Objective: Run agents inside defined limits.

Phase 1 runs the one agent from F01 inside limits fixed before the attempt. The agent may generate and repair code inside the allow-list. It does not decide correctness. Module 4 does.

## Plan

The allow-list is the only writable scope. A write inside the list is kept. A write outside it is rejected and recorded. The agent cannot grow the list. The agent process and the verification process do not share a writable workspace. Verification reads a copy the agent cannot modify.

Every kept write records the path, the hash before, the hash after, the agent name, and the attempt number. A changed path with no log entry is a block.

The retry cap is fixed before the run. The fixture cap is 2. Each retry and each repair is a new attempt under the same frozen contract and the same allow-list. Attempt 3 does not start. A repair is not a pass. Two subtasks marked independent still run one at a time. The second starts only after the first finishes, and neither run sees the other's allow-list.

A diff that touches an approved contract or a critical test is a block, including an edit that landed inside the allow-list by mistake. The approved bytes and the critical tests stay at their approved hashes. The coding agent cannot edit approved contracts.

Each attempt emits one event: model id, input tokens, output tokens, wall time, and cost. An unknown field is stored as `unknown`. The event is never omitted. The ledger that prices those events is later work. This feature must not drop the event while that ledger is absent.

## Acceptance criteria

- A write inside the allow-list is kept, a write outside it is rejected, and the rejection is in the report.
- Verification reads a copy the agent cannot modify.
- A one-file edit has one log entry with path, before hash, after hash, agent, and attempt, and a changed file with no entry blocks the run.
- A failing fixture stops after two attempts, both attempts share the original contract hash and allow-list, and the report status is failed.
- A fixture that modifies an approved contract or a critical test is blocked, both hashes match the approved versions, and the run is not accepted.

## Evidence

The run report: allow-list, change log, attempt count, block reason, and the cost event. The diff shows what changed. A passing test is not a proof of correctness. The agent's own repair is not a pass.

## Depends on

- F01 for the one configured agent. A run with no configured agent does not start.
- F03 for the frozen contract hash. F05 later supplies the allow-list. Until that plan exists, a human writes the list, and it stays non-empty and narrower than the repository.

## Does not include

- Automatic model routing (F25) and parallel subtasks.
- The token ledger (phase 2). This feature only emits the event.
- Schema validation (F03) and contract-case execution (F09).
- A field on the run record that marks the requirement passed.

## Related

- `docs/plan/modules/03-code-generation.md`
- F01, F03, F05, F08, F28, F29
- UC-05
