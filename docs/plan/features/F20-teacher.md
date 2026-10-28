# F20 — Teacher

- Module path: `docs/plan/modules/08-teacher-learning.md`
- Phase: 3
- Objective: Evaluate results and propose improvements.

This is the professor module. It evaluates stored results and proposes a next step. It cannot mark failing code as correct. A note is written only from a reproducible result. Another model's opinion is not a result.

## Plan

Read states, reproductions, and divergences that already exist. Ignore explanation fields and model confidence. Point at a strategy error when the records support it: a missing scenario, a weak expected result, a skipped critical rule, or a method that found fewer defects on the same tasks. The note cites the result ids it used.

The note writes no state and no contract. A FAIL stays FAIL until the same check passes on a new revision. A sentence that calls the failure acceptable leaves the stored FAIL in place. UNKNOWN from a missing test stays UNKNOWN. The proposal may ask for that evidence. It does not store PASS.

Accepting a proposal schedules work. That work has to produce its own result before a new state can be written. The coding agent's own summary is not the rollup. The rollup remains computable when that summary is removed.

## Acceptance criteria

- A FAIL with a resolved reproduction yields a proposal that cites that result id, and the stored state stays FAIL.
- A proposal payload that sets PASS is rejected, and the FAIL remains.
- An UNKNOWN from a missing test yields a proposal about the missing evidence and does not store PASS.
- A note with no result id is rejected.
- Removing the coding agent's summary leaves the rollup unchanged.

## Evidence

Diff the state row before and after the teacher run. The evidence is that diff plus the proposal's result ids. Recompute the citations from the stored results. A model paragraph in the proposal is wording, not a new verdict.

- Run the teacher on the failing fixture. Archive the proposal and the unchanged FAIL.
- Submit a PASS write through the proposal path. Archive the rejection.
- Run the missing-test fixture. Archive UNKNOWN and the cited empty result.
- Drop the author summary from the report inputs. Archive the same rollup.

## Depends on

- F18 states and F19 reports that already cite reproductions or located divergences.
- The proposal rules in `docs/plan/modules/08-teacher-learning.md`.

## Does not include

- Relabeling FAIL, UNKNOWN, or NOT_APPLICABLE.
- Editing approved contracts, tests, or code.
- Choosing a model, updating an estimate, or fitting risk weights (F23, F17).
- Storing a memory row. F22 records the outcome after a verified re-run.

## Related

- `docs/plan/modules/08-teacher-learning.md`
- F18, F19, F22, F23
- UC-43, UC-44
