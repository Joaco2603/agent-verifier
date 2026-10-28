# F18 — Decision engine

- Module path: `docs/plan/modules/07-risk-decision.md`
- Phase: 1
- Objective: Classify results as PASS, FAIL, UNKNOWN, or NOT_APPLICABLE.

Phase 1 can finish with no numeric score. A missing score is not a pass. UNKNOWN is not a pass. A missing test is not evidence of safety.

## Plan

Each required check stores exactly one state. PASS means that check has a reproducible success. FAIL means that check has a reproducible failure, or a critical rule has fired on a reproduced failure. UNKNOWN means the check has no reproducible result: a missing run, a parse failure, an unresolved fault, or two results that were not reproduced. NOT_APPLICABLE means the check's precondition does not apply to this change, and the reason is stored.

The change also stores one rollup. The rollup is FAIL if any required check is FAIL. Otherwise it is UNKNOWN if any required check is UNKNOWN. Otherwise it is NOT_APPLICABLE if every check is NOT_APPLICABLE. Otherwise it is PASS. Before Phase 2 depth exists, the required checks are the Phase 1 deterministic contract checks.

UNKNOWN and NOT_APPLICABLE are never stored as PASS. A write that sets PASS with an empty evidence pointer is rejected. A missing test that applies to the subject stays UNKNOWN.

Each state cites the contract revision and the raw result when a run exists. The engine reads approved contracts and does not edit them. An explanation is not an input to the state.

## Acceptance criteria

- A missing run is UNKNOWN, and that row is not reported as PASS.
- A reproducible failure is FAIL and cites the raw result. A reproducible success is PASS and cites the raw result.
- NOT_APPLICABLE includes a reason. A set of only NOT_APPLICABLE checks rolls up to NOT_APPLICABLE.
- One FAIL makes the rollup FAIL. One UNKNOWN with no FAIL makes the rollup UNKNOWN.
- The same records produce the same states on a second classification. An explanation file does not change them.

## Evidence

Replay the check records. The evidence for a state is the reproducible result behind it. A model explanation does not support a state, and it cannot replace a test result.

- Archive the missing-test fixture as UNKNOWN with an empty pointer, and archive the rejected PASS write.
- Archive the failed-run and passed-run fixtures with their raw results and revisions.
- Archive the all-NOT_APPLICABLE rollup and the mixed UNKNOWN rollup.
- Run the classification twice. Diff the state table.

## Depends on

- Check records with a precondition, a contract revision, and a pointer to a raw result, from `docs/plan/modules/07-risk-decision.md`.
- Phase 1 deterministic results for the benchmark. Later features may add pointers. They do not change these four states.

## Does not include

- Computing R or choosing Narrow, Standard, or Deep (F17).
- Writing the report layout (F19). This feature stores the state and the rollup.
- Producing AST facts or integration captures (F12, F14).
- Clearing UNKNOWN because a model, a teacher note, or a low score says the change is fine.

## Related

- `docs/plan/modules/07-risk-decision.md`
- F08, F09, F17, F19
- UC-12, UC-13, UC-15
