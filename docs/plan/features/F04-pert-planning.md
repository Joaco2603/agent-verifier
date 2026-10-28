# F04 — PERT planning

- Module: `docs/plan/modules/01-task-planning.md`
- Phase: 2
- Objective: Estimate duration, uncertainty, and effort.

Phase 2 starts after the Phase 1 benchmark has a measured result: defect escape, false alarms, verification cost, and requirement coverage. PERT estimates duration. PERT does not judge correctness.

## Plan

Each task stores three durations in one unit: optimistic (O), most likely (M), and pessimistic (P). The effort inside those numbers includes implementation, fixes, and retries. Expected duration is `E = (O + 4M + P) / 6`. Variance is `((P - O) / 6)^2`. The report labels both as duration estimates.

An estimate with no actual duration is marked subjective. After every attempt, store actual time, count failed attempts, fixes, and retries, set a new O, M, and P from that record, recompute E and variance, and keep the previous E beside the new E.

Ambiguous requirements and high-risk areas are named risks on the task. They widen P. They stay risks. While F02 still marks a requirement ambiguous, contradictory, or incomplete, this feature withholds a ready E for every subtask that depends on it.

E has no field that sets `gate`, `approval.status`, or a pass on source. A shorter E leaves a critical security block in place. Generation and verification stay separate.

## Acceptance criteria

- A fixture with fixed O, M, and P yields `E = (O + 4M + P) / 6` and variance `((P - O) / 6)^2`, and the report calls both duration estimates.
- An estimate with no actuals is marked subjective.
- A second attempt that is a retry changes E, keeps the previous E, and includes fixes and retries in the actual time.
- An open ambiguity produces no ready E. A named high-risk area is stored beside a wider P.
- The estimate record has no field that marks code correct.

## Evidence

The plan record: O, M, P, E, variance, risks, and actual durations beside the estimates. The pair shows expected time and measured time. It is not evidence that an observable holds. Passing tests are not a proof.

## Depends on

- A measured Phase 1 benchmark (UC-60) before this feature is built.
- F02's defect list, so an open ambiguity can withhold a ready E.
- A task id. Behavior-changing tasks cite a contract id from F03.

## Does not include

- A verdict on correctness, security, or contract cases.
- Splitting a task (F05) and the critical path (F06).
- Teacher scores, reinforcement learning, or the model router as inputs to E.
- Edits to approved contracts.

## Related

- `docs/plan/modules/01-task-planning.md`
- F02, F05, F06, F10
- UC-37, UC-40
