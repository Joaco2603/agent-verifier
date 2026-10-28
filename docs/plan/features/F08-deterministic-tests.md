# F08 — Deterministic tests

- Module: `docs/plan/modules/04-deterministic-verification.md`
- Phase: 1
- Objective: Run unit, integration, and regression tests.

Phase 1 runs these checks before commit, outside the agent's writable workspace. A passing test is not a proof of correctness. Another model's opinion is not ground truth.

## Plan

Unit tests cover every behavior the contract names. Each check records pass or fail against that requirement id. The suite runs where the agent cannot edit it. One failing unit check names the check, the requirement id, and the failure, and the run is not accepted.

Integration runs only for the changed path, and only when a harness already exists. A missing harness is recorded. The absence is not a pass. The other Phase 1 checks still run.

Regression checks the observations of frozen approved contracts. A break in a frozen observation fails the run. New behavior needs a new approved version from module 2. Rewriting the regression to fit the new code is a critical-test edit and blocks the run. The coding agent must not edit the suite, the frozen contract, or a critical test to obtain a pass.

Results stay in this feature's report. A pass here does not set the contract result by itself, and it does not clear a critical security block from F10.

## Acceptance criteria

- A failing unit check names the check, the requirement id, and the failure, and the run is not accepted.
- A repo with an integration harness runs it on the changed path and records the result.
- A repo without that harness records the absence and does not treat the absence as a pass.
- A change that violates a frozen observation fails, and an edit that rewrites the regression to fit the new code is blocked.
- A fully passing set of these checks leaves a critical security block in place.

## Evidence

The verification report: requirement id, check name, result, and contract hash. A pass is evidence that those checks ran and matched. Passing tests are not a proof of correctness.

## Depends on

- A tree from F07, verified from a copy the agent cannot modify.
- Frozen approved contracts from F03, whose observations regression re-checks.
- F10, so a test pass is defined as unable to clear a critical security failure.

## Does not include

- Example-case execution and `bounded_output` as a property template (F09).
- Static analysis, fuzzing, mutation, concurrency, transactions, and formal checks. Each waits for the benchmark result named in module 4.
- Using a green suite as acceptance for the requirement.
- Agent edits to the suite or to a critical test.

## Related

- `docs/plan/modules/04-deterministic-verification.md`
- F03, F07, F09, F10, F31
- UC-10, UC-15
