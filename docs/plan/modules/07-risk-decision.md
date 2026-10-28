# Module 7 — Risk and decision

The four states and the evidence report are Phase 1, because the first benchmark needs them. The numeric risk score and the selection of verification depth are Phase 2, after there is history to calibrate. Feature ids: F17, F18, F19.

Phase 1 can finish with no numeric score. A missing score is not a pass. The score, once it exists, ranks attention. Critical rules still force checks and blocks when the score is low.

## Shared rules

- Reproducible AST facts and runtime results support a state. An LLM explanation does not.
- The scoring policy reads approved contracts and must not edit them.
- A high score on one term does not cancel a critical rule.

## Risk score per change

Phase 2 assigns one score to the change under review:

R = 0.30C + 0.25I + 0.20S + 0.15U + 0.10H

Each letter is an integer from 0 to 100. C is component criticality, I is dependency impact, S is attack exposure, U is requirement uncertainty, and H is defect history. The weights sum to 1. They are an initial uncalibrated choice, not a measured model. Replace them only with weights fit on later confirmed defects, and keep the old weights recorded. R does not by itself set PASS, FAIL, UNKNOWN, or NOT_APPLICABLE.

## Component criticality

C rates how severe a wrong behavior is in this component, using the approved contract and the component's role. Record the reason for the number, including the contract id. A component name that sounds important does not set C. Absence of a stated role leaves C unset and the score uncomputed.

## Dependency impact

I rates how many in-repo callers and external dependents the change can affect, using the call graph and dependency list from Module 5 when those facts exist. Before that graph exists, I is unset and R is uncomputed. Do not fill I from a dependency's name.

## Attack exposure

S rates whether the change touches an exposed boundary: untrusted input, authentication, authorization, secrets, or a network surface named by the contract. Record the boundary and the file. No such boundary is S = 0 with that reason stored. A guessed threat story without a boundary does not raise S.

## Requirement uncertainty

U rates how much of the relevant requirement and contract is still missing or internally conflicting, using the Module 5 field status once comparison exists. In Phase 1, before comparison exists, record U as unset rather than as zero. Missing requirements raise U. Confident prose that restates an unclear requirement does not lower U.

## Defect history

H rates confirmed defects previously tied to this component or this kind of change. Count only defects that have a reproduced failure. A memory of "this area feels risky" with no defect id is H = 0 until history exists, and the report says the history is empty. Empty history is an input, not a reason to skip checks.

## Quantity and quality of evidence

Quantity is how many required checks for this change have a stored result. Quality is whether that result is reproducible and tied to a file and line or to a rerunnable scenario. A large set of unnamed opinions has quantity zero. Evidence quantity and quality are not terms in R. They feed depth selection and the state.

## Selection of verification depth

Phase 2 chooses a depth after R is computed and after evidence quality is known. The initial policy, also uncalibrated, is:

- Narrow: deterministic contract checks, plus AST comparison for touched files when Module 5 exists.
- Standard: Narrow, plus integration scenarios, fault injection, and the retry, timeout, and duplicate cases.
- Deep: Standard, plus recorded concurrency schedules and coverage-guided fuzzing.

Higher R moves the default toward Deep. Thin or non-reproducible evidence keeps the depth at least at Standard. The chosen depth and the reason are stored. Depth selection does not edit contracts.

## Critical rules that cannot be offset

Two rules ignore R and ignore favorable points elsewhere. An admin or permission change forces Deep checks and blocks while any required permission check is FAIL or UNKNOWN. A critical security failure, reproduced or required and still unresolved, forces those checks and the same block. Other terms, a low R, a strong evidence pile on unrelated checks, or a later teacher note cannot clear the block. NOT_APPLICABLE on a permission check requires a recorded reason that the change has no admin or permission surface.

## States PASS, FAIL, UNKNOWN, NOT_APPLICABLE

Phase 1 stores exactly one of these states per required check, and one rollup for the change.

- PASS: every required check at the chosen depth has a reproducible success, and no critical rule is open. Before Phase 2 depth exists, required checks are the Phase 1 deterministic contract checks.
- FAIL: a required check has a reproducible failure, or a critical rule has fired on a reproduced failure.
- UNKNOWN: a required check has no reproducible result. That includes a missing run, a parse failure, an unresolved fault, or two results that were not reproduced.
- NOT_APPLICABLE: the check's precondition does not apply to this change, and the reason is stored.

UNKNOWN and NOT_APPLICABLE are never stored as PASS. The rollup is FAIL if any required check is FAIL, otherwise UNKNOWN if any required check is UNKNOWN, otherwise NOT_APPLICABLE if every check is NOT_APPLICABLE, otherwise PASS.

## Final report

Phase 1 writes a report with the rollup state, each check state, and the findings a second run can reproduce. Each finding has a check id, a file and line or a reproduction command, and the observed result. The report lists limitations in their own section: unparsed files, unseen dynamic calls, empty defect history, and, in Phase 2, the fact that the weights are not a measured model. A paragraph that only explains the change is not a finding.

## Acceptance criteria

- [ ] A Phase 1 benchmark run emits PASS, FAIL, UNKNOWN, or NOT_APPLICABLE for each required check, and a rollup using the rule above, with no numeric R required.
- [ ] The Phase 1 report lists reproducible findings and a limitations section. A finding without a location or a reproduction command is absent.
- [ ] UNKNOWN is stored when the run is missing, and that row is not reported as PASS.
- [ ] NOT_APPLICABLE includes a reason, and a set of only NOT_APPLICABLE checks rolls up to NOT_APPLICABLE.
- [ ] When Phase 2 computes R, each of C, I, S, U, and H is an integer from 0 to 100 or the score is left uncomputed. The weights 0.30, 0.25, 0.20, 0.15, and 0.10 are labeled uncalibrated.
- [ ] Evidence quantity and quality change depth and are absent from the formula for R.
- [ ] An admin or permission change, and a critical security failure, force Deep checks and a block on FAIL or UNKNOWN. A low R does not remove the block.
- [ ] No scoring step modifies an approved contract.
- [ ] F17, F18, and F19 close only when these checks pass. A narrative risk rating closes none of them.

## Evidence

Evidence for a state is the reproducible check result behind it. Evidence for R is the stored term values and the reasons that cite contracts, call-graph facts, boundaries, or defect ids. The report's limitations are part of the record. Model explanations are not evidence and do not change a state.

## Later

Refit the weights only after confirmed defects exist to measure them, and archive the uncalibrated weights. Module 6's genetic search stays behind its own hourly comparison and does not feed R directly. Module 8 may propose a depth or a weight change. The proposal waits for a human or a measured refit before it replaces the stored policy.

## Related files

- `docs/plan/modules/05-ast-code-to-spec.md` — located facts used for impact, uncertainty, and evidence quality.
- `docs/plan/modules/06-integration-search.md` — runtime results that can set FAIL, and the runs Deep depth includes.
- `docs/plan/modules/08-teacher-learning.md` — proposals that must not edit contracts or states.
