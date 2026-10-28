# F14 — Advanced integration tests

- Module path: `docs/plan/modules/06-integration-search.md`
- Phase: 2
- Objective: Find errors between services and components.

A failure counts when a runtime result reproduces it. The written scenario does not decide correctness. AST facts may suggest the boundary. They do not replace the run.

## Plan

An integration scenario has an id, a contract id, preconditions, ordered steps, and an expected result copied from the approved contract. It runs the composed services and components that contract names, along the dependency path of the files that changed.

The stored outcome is the observed result and whether it matched the contract field by field. Expected behavior is the contract's precondition, effect, and failure. Wording overlap with the contract is not a match.

A written story with no steps and no expected result is not a scenario. A run that stays inside one component, with collaborators replaced, is not an integration result. Names of helpers are labels. The assertion that ran is the check.

The scenario reads the approved contract and does not edit it. An account of what probably happened is not a result. Each confirmed mismatch stores a command or fixture that runs the same check again.

## Acceptance criteria

- A scenario without a contract id, ordered steps, and a structured expected result is rejected.
- A two-component run that misses a contract field stores the observed result, the field, and a command that fails that same check on a second run.
- A single-component run is not stored as an integration pass.
- Wording that resembles the contract, with a different observed effect, is a mismatch.
- An explanation attached after the run leaves the observed result and the field match unchanged.

## Evidence

Evidence is the scenario record, the observed runtime result, and the reproduction command. Re-run that command. A model explanation cannot replace the runtime result.

- Run the cross-service fixture. Archive the observed result, the contract field, and the second-run result.
- Run the story-only fixture. Archive the rejection.
- Run the single-component fixture. Archive that it was not stored as an integration pass.
- Record the revision and the contract id on every stored outcome.

## Depends on

- Approved contracts for the expected precondition, effect, and failure.
- F12 for the dependency path that selects which components run together.
- `docs/plan/modules/06-integration-search.md` for the scenario record.

## Does not include

- Coverage-guided fuzzing, fault combinations, and schedule search (F15).
- Genetic search (F16).
- The Phase 1 frozen-contract regression sweep (F31).
- Editing approved contracts, or treating a passing unit test as an integration result.

## Related

- `docs/plan/modules/06-integration-search.md`
- F12, F15, F18, F31
- UC-28
