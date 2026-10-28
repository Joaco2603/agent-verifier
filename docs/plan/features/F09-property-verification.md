# F09 — Property verification

- Module: `docs/plan/modules/04-deterministic-verification.md`
- Phase: 1
- Objective: Check invariants and general behavior.

Phase 1 checks the property material the contract schema already names: example cases and `bounded_output`. Further templates stay on hold until a task cannot be stated without them: idempotency, conservation, monotonicity, reversibility, atomicity, authorization, and state transitions.

## Plan

Read one approved contract. Refuse the check when `approval.status` is not `approved`. Do not modify the file. A case whose input breaks a precondition is an invalid contract from F03. This feature does not execute it.

Run each example case against the declared observables. Run each `bounded_output` property on its numeric field, using `min` and `max` when `max` is present. Finish every check as `PASS`, `FAIL`, `UNKNOWN`, or `NOT_APPLICABLE`, with the contract revision and the raw result. `UNKNOWN` is the result when the check cannot see production concurrency, infrastructure, or live data.

A model may explain the report. The explanation does not change the result. A `PASS` covers the listed observables. It is not a proof that the program is correct. Passing tests are not a proof.

A general property-based suite, beyond `bounded_output` and the example cases, earns code only when a task in the Module A corpus cannot state its observable outcome with cases plus `bounded_output`. Until that gap is written down, the schema keeps a single property template. Adding one of the hold templates as a new schema field is a rejected contract.

## Acceptance criteria

- Phase 1 runs example cases and `bounded_output`, and the schema still allows only `template: bounded_output`.
- A `FAIL` names the requirement id, the case or property id, and the contract revision.
- A model explanation is stored apart from the four result values and does not change them.
- A contract that adds idempotency, conservation, monotonicity, reversibility, atomicity, authorization, or state transitions as a schema field is rejected.
- Those seven templates stay out of the schema until a written gap shows a task that cases plus `bounded_output` cannot state.

## Evidence

The per-check result, the revision, and the raw comparison. A `PASS` is evidence about the listed observables. A passing property check is not a proof that the program is correct beyond those observables.

## Depends on

- F03 for an approved file that has passed the envelope and structural rules 1–9.
- F07 for an implementation to execute, from a workspace the agent cannot modify during verification.
- `docs/module-a/README.md` for the closed fields and the rule that new templates wait on a corpus miss.

## Does not include

- The seven hold templates (UC-53 through UC-59) as schema fields.
- Z3, a solver, or free logical constraints.
- A runner built before `C >= 10`, `F <= 2`, `W <= 3`, and median `M <= 25`.
- The unit, integration, and regression rows (F08).

## Related

- `docs/plan/modules/04-deterministic-verification.md`
- `docs/module-a/README.md`
- F03, F08, F10
- UC-09, UC-11, UC-12, UC-13
