# F32 — CI/CD integration

- Module: `docs/plan/modules/12-security-audit.md`
- Phase: 1
- Objective: Block changes that break critical conditions.

## Plan

The check runs on the change before it is accepted. It fails closed. Two results block the change on their own: a FAIL of a critical contract, and an invalid contract diff. An invalid contract diff is any diff under `contracts/` after approval, the same condition contract protection uses.

UNKNOWN does not pass a critical requirement. A missing result does not pass one either. Not applicable passes a critical requirement only when the contract itself says the requirement does not apply to this change, and that reason is stored. Silence is not that reason.

Critical security blocks ignore the router and the score. The check does not read the model route or the risk score to turn a critical FAIL into a warning. A non-critical failure is reported and does not, by itself, use this block.

The job's exit is the block. A comment, a model explanation, or a green unit-test job elsewhere does not clear it. The agent's own tests may pass while this check still fails. That split is expected, and it is the comparison the benchmark records.

## Acceptance criteria

- A critical contract FAIL fails the check and rejects the change.
- A diff under `contracts/` after approval fails the check, including a diff produced by the model router.
- UNKNOWN or a missing result on a critical requirement fails the check.
- A critical security FAIL still fails the check when a score is low or a different model was routed.
- The check output names the contract id, the revision, the state, and the raw result. It does not offer a pass that the deterministic result did not give.

## Evidence

- The check record: contract id, revision, state, and raw result for each critical requirement on the change.
- The contract-tree diff status at the time of the check.
- The reject or accept decision, with the blocking row when the decision is reject.

## Depends on

- Critical contracts marked to block, already approved.
- F29 for the invalid-diff rule.
- F28 so generated code used by the check runs inside isolation.
- A change hook that can reject the change. The hook is the integration. A delivery pipeline beyond that hook is not required.

## Does not include

- Deploying the change, publishing an artifact, or a multi-stage pipeline.
- Passing a critical requirement because the unit tests passed.
- Letting the router edit the contract to clear the check.
- A blended score that offsets a critical FAIL.

## Related

- `docs/plan/modules/12-security-audit.md`
- F28, F29, F30, F25
- UC-05, UC-12, UC-21, UC-63
