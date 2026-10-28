# F22 — Experience memory

- Module path: `docs/plan/modules/08-teacher-learning.md`
- Phase: 3
- Objective: Record decisions, errors, fixes, and historical results.

Memory stores verified outcomes. Model confidence is not an outcome. Another model's opinion about the task is not a row.

## Plan

Append a decision row for the depth, the checks, or the model actually used. The row has a task id and a pointer to the evidence for that choice.

Append an error row for a defect that has a reproduced failure: defect id, the failing check, and the evidence pointer. A note that the area feels risky, with no defect id, is not a row.

Append a fix row only when the minimized reproduction passes on the fix revision, or when the Phase 1 check that failed now passes on that revision. The row cites the earlier defect id, the fix revision, and the new result. The earlier error row stays in place. A teacher proposal with no new passing run does not create a fix row.

Append a historical-result row for a finished measurement that points at evidence, including separate F21 metrics when those were computed. Corrections are new rows that cite the row they correct. Existing rows are not overwritten.

Explanation text without a stored check or reproduction is rejected. Queries for what failed and what was fixed read these rows.

## Acceptance criteria

- A decision row cites the depth, the checks, or the model that was used, and an evidence pointer.
- A FAIL with a replayable artifact produces an error row. A confidence value with an empty pointer is rejected.
- A fix proposal with no new passing run produces no fix row.
- A later pass of the same check produces a fix row, and the original error row remains readable.
- Replaying the append log yields the same rows in the same order.

## Evidence

The append log and a replay of the cited artifacts are the evidence. A second read of the same log produces the same rows. An LLM explanation cannot replace a replayed artifact.

- Append the failing fixture and replay its artifact. Archive the error row and the test result that still fails.
- Submit the confidence-only fixture. Archive the rejection and an unchanged log.
- Append the later passing run. Archive both rows and the new test result.
- Read back what failed with the explanation field removed. The error row is still there.

## Depends on

- F18 states and replayable evidence pointers.
- F15 minimized reproductions when the fix is an integration defect.
- The memory rules in `docs/plan/modules/08-teacher-learning.md`.

## Does not include

- Model confidence, estimated risk, or fitness as a stored outcome.
- Overwriting a past error because a later revision passed.
- Changing H, a state, or a contract from a remembered pattern. F17 may read defect ids. This feature does not edit H.
- Teacher prose with no verified re-run (F20).

## Related

- `docs/plan/modules/08-teacher-learning.md`
- F15, F17, F18, F20, F21
- UC-51
