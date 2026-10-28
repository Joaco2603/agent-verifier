# F17 — Risk evaluation

- Module path: `docs/plan/modules/07-risk-decision.md`
- Phase: 2
- Objective: Decide how deep verification must go for each change.

The score ranks attention. It does not set PASS, FAIL, UNKNOWN, or NOT_APPLICABLE. The weights are an initial uncalibrated choice.

## Plan

Phase 2 assigns one score when every required term is an integer from 0 to 100:

R = 0.30C + 0.25I + 0.20S + 0.15U + 0.10H

C is component criticality, from the approved contract and the component's role, with the contract id. A component name does not set C. No stated role leaves C unset and R uncomputed. I is dependency impact, from the F12 call graph. Before that graph exists, I is unset and R uncomputed. A dependency's name does not fill I. S is attack exposure at a boundary the contract names: untrusted input, authentication, authorization, secrets, or a network surface. No such boundary is S = 0 with that reason. A threat story without a boundary does not raise S. U is requirement uncertainty from missing or conflicting fields. Missing requirements raise U. Prose that restates an unclear requirement does not lower U. H is defect history: confirmed defects with a reproduced failure. Empty history is H = 0, and the report says the history is empty. Empty history is not a reason to skip checks.

Evidence quantity and quality are not terms in R. They affect depth. Narrow runs deterministic contract checks, plus AST comparison for touched files when Module 5 exists. Standard adds integration scenarios, fault injection, and the retry, timeout, and duplicate cases. Deep adds recorded schedules and coverage-guided fuzzing. Higher R moves the default toward Deep. Thin or non-reproducible evidence keeps the depth at least at Standard. A low score with no forced check stays on the smaller suite. A high score with missing evidence stops for a person, and those checks stay UNKNOWN.

A permission or admin change forces security checks at any score. Those checks are the Deep set, and the change stays blocked while any required permission check is FAIL or UNKNOWN. A critical security failure that is reproduced, or required and still unresolved, forces the same checks and the same block. A low R does not clear the block.

## Acceptance criteria

- C = 100 and I = S = U = H = 0 yields R = 30. Each stored term is an integer from 0 to 100, or R is uncomputed.
- Unset C or unset I leaves R uncomputed. Empty defect history stores H = 0 and says the history is empty.
- Evidence quantity and quality are stored beside R and are absent from the formula.
- A permission or admin change at a low R still schedules the Deep security checks and records the forcing file.
- A low R does not clear a block while a required permission check is FAIL or UNKNOWN.

## Evidence

Recompute R from the stored integers. The evidence is those integers and the reasons that cite a contract id, a call-graph fact, a boundary file, or a defect id. A model estimate of risk is not an input.

- Diff the golden vector against the recomputed R, and confirm the stored weights are 0.30, 0.25, 0.20, 0.15, and 0.10, labeled uncalibrated.
- Run the missing-role fixture and the missing-graph fixture. Archive uncomputed R.
- Run the admin-edit fixture at a low vector. Archive the forcing file, the Deep selection, and the block.
- Run the empty-history fixture. Archive H = 0 and the empty-history limitation.

## Depends on

- Approved contracts for C and for attack boundaries.
- F12 for the call graph that I uses, and F13 field status for U once comparison exists.
- Reproduced defect ids for any H above 0, from `docs/plan/modules/07-risk-decision.md`.

## Does not include

- Putting evidence quantity or quality inside R.
- Setting a check state. States stay in F18. R only ranks depth.
- Treating a low R as evidence the change is safe.
- Replacing the weights without archiving this uncalibrated set.

## Related

- `docs/plan/modules/07-risk-decision.md`
- F10, F12, F13, F18
- UC-17, UC-18, UC-19, UC-20
