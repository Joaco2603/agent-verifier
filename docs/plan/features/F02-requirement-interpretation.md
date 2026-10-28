# F02 — Requirement interpretation

- Module: `docs/plan/modules/02-requirements-contracts.md`
- Phase: 1
- Objective: Detect ambiguity, contradictions, and incomplete requirements.

Phase 1 flags three defects in a draft contract before a human approves it. The format stays the one in `docs/module-a/README.md`: YAML, a JSON Schema envelope, and closed fields. This feature reports defects. It does not approve the file.

## Plan

Before approval, structural checks flag three defects. An ambiguity is a phrase with more than one reading that would change an observable. A contradiction is two claims that cannot both hold, including a case input that breaks its precondition, an evidence ref that points nowhere, or `priority: critical` paired with `gate: report`. An incomplete requirement is a missing field the closed schema requires, or a criterion that names no observation.

The draft lists each defect with the requirement id and the sentences involved. None of the three can be approved. A model's reading of the request is a proposal. It is not the contract, and it is not ground truth.

Closed fields are the vocabulary: declared inputs, declared observables, numeric input constraints, example cases, and `bounded_output`. A behavior the schema cannot name goes in `limitations` or stays out of the file. The interpreter does not add a schema field to make the defect disappear.

A human resolves the list and approves a revision. Silence is not approval. The interpreter does not set `approval.status` to `approved` and does not edit an approved file.

## Acceptance criteria

- One fixture of each kind (ambiguity, contradiction, incomplete) is reported with the requirement id and the sentences involved.
- None of those three fixtures can be approved.
- A case whose input breaks a precondition is reported as a contradiction and never runs against code.
- A criterion with no observation is reported as incomplete.
- A model proposal is stored apart from the contract and cannot set approval.

## Evidence

The defect list: kind, requirement id, and the sentences involved. A clean list means the draft is ready for a person to approve. A green test run does not approve a version. Passing tests are not a proof.

## Depends on

- The envelope, closed fields, and structural rules in `docs/module-a/README.md`.
- F03 for the file that stores the approved revision after the defects are gone.

## Does not include

- Human approval itself, version ids, and the edit block during a run (F03, F29).
- Executing example cases (F09) or generating code (F07).
- New schema fields for bounds, permissions, states, atomicity, or idempotency.
- A runner, a gateway, or a UI.

## Related

- `docs/plan/modules/02-requirements-contracts.md`
- `docs/module-a/README.md`
- F03, F04, F09
- UC-01, UC-03, UC-06
