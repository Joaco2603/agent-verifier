# F03 — Verifiable contracts

- Module: `docs/plan/modules/02-requirements-contracts.md`
- Phase: 1
- Objective: Set acceptance criteria that do not depend on the generated code.

Phase 1 freezes acceptance in an approved contract before any agent runs. The format is already decided in `docs/module-a/README.md`. This feature does not reopen it.

## Plan

A human authors one requirement as one YAML file. The envelope is JSON Schema with closed fields: declared inputs, declared observables, numeric input constraints, example cases, and one property template, `bounded_output`. Structural rules 1–9 run before any implementation. A draft may be stored. A draft cannot count as a pass.

Each acceptance criterion names an observation: the input, the action, and the outcome, including a rejected action. A criterion that only praises the result stays incomplete. Those criteria are the oracle. The generated code and the agent's tests are not the oracle.

A critical contract carries `gate: block`. A later risk score cannot turn that block into a warning. `priority: critical` with `gate: report` fails the schema. A person approves the revision. The git blob of the approved file is the identity in this phase. There is no signature service.

The frozen-contract experiment in `docs/module-a/README.md` uses 20 tasks. The agent receives the ambiguous sentence and must not receive or edit the YAML. Build a runner only if `C >= 10`, `F <= 2`, `W <= 3`, and median approval time `M <= 25` minutes. If `W > 3`, change the contract vocabulary and repeat the experiment. If `C < 10` because the agent's own tests already fail the bug, do not build a runner for that claim. F30 records the benchmark inputs. This rule decides whether a runner is justified.

`C` is a catch: the contract is not weak, the agent tests pass, and the contract cases fail. `F` is a false accept: the cases pass and a human judges the function wrong against the approved observables. `W` is a weak contract: it passes the seeded wrong implementation. `M` is minutes to write and approve one contract.

## Acceptance criteria

- An approved contract is human-authored YAML, validates against the envelope, and names observations rather than the generated tests.
- `priority: critical` with `gate: report` fails schema validation.
- A case that breaks a precondition fails structural rule 7 and never runs against code.
- A critical file whose only check is a bound on one number fails structural rule 9 until the failure outcome is present or the gap is limited and the priority is lowered.
- No runner exists unless `C >= 10`, `F <= 2`, `W <= 3`, and median `M <= 25`.

## Evidence

The approved YAML, the schema result, the structural-rule result, and the git blob. A passing contract is evidence about the listed observables. Passing tests are not a proof. A passing contract is not a proof that the program is correct.

## Depends on

- `docs/module-a/README.md` for the envelope, the nine structural rules, the freeze, and the experiment counts.
- F02 when the draft has an ambiguity, a contradiction, or a missing observation.

## Does not include

- A runner, a gateway, or a UI before the experiment rule is met.
- Z3, a custom DSL, OpenAPI, or Pact as the contract format.
- Agent edits under `contracts/`. The coding agent cannot edit approved contracts.
- Property templates other than `bounded_output`.

## Related

- `docs/plan/modules/02-requirements-contracts.md`
- `docs/module-a/README.md`
- F02, F07, F09, F10, F29, F30
- UC-04, UC-07, UC-62
