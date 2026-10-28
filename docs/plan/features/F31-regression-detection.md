# F31 — Regression detection

- Module: `docs/plan/modules/04-deterministic-verification.md`
- Phase: 1
- Objective: Stop a fix from introducing other defects.

## Plan

A fix is a new change. Before that change can pass, re-run the frozen contracts for behavior the diff can affect. The affected set is conservative in this phase: every approved contract whose declared operation or declared files overlap the diff, plus the contract the fix was trying to satisfy. A contract outside that overlap is not silently skipped by the agent. It is omitted only when the overlap rule says so, and the omission is listed.

The contracts stay frozen. The fix does not edit them to make the re-run pass. A diff under `contracts/` after approval invalidates the run, under the same rule as contract protection.

Each re-run finishes as pass, fail, unknown, or not applicable, with the contract revision and the raw result. A new fail on a contract that previously passed is a regression. The fix does not land while that regression is open. Unknown on a critical contract does not count as "no regression."

The re-run uses the same oracles as the first gate. It does not ask the model that wrote the fix to judge whether the other behavior still holds.

## Acceptance criteria

- Every fix records the diff, the overlap rule, the contracts selected, and the contracts omitted.
- Selected contracts are the approved blobs, not a copy edited during the fix.
- A contract that passed before the fix and fails after it is reported as a regression and blocks the change.
- Unknown on a selected critical contract blocks the change. It is not reported as a clean re-run.
- A pass is not declared from the model's summary of the diff.

## Evidence

- The diff and the overlap explanation for each selected or omitted contract.
- Prior result and new result for each selected contract, with revision and raw output.
- The regression list, or an explicit empty list when every selected contract still passes.

## Depends on

- Approved contracts with a declared operation or declared files.
- A previous result for those contracts on the revision the fix started from.
- F29 so the re-run cannot be satisfied by editing the oracle.
- F28 so the re-run executes inside the same isolation limits.

## Does not include

- A learned selector that drops contracts to raise the pass rate.
- Integration scenarios along a full dependency path, fault injection, or a genetic search.
- Mutation testing of the fix.
- Treating a green run of the single repaired contract as proof that nothing else broke.

## Related

- `docs/plan/modules/04-deterministic-verification.md`
- F08, F29, F30, F32
- UC-09, UC-12, UC-27
