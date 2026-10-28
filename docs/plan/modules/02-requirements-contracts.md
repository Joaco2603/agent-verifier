# Module 2 — Requirements and contracts

**Phase when it earns code:** 1.

This module turns a request into a versioned contract that verification can check before commit. The format is already decided. A human authors YAML. The envelope is JSON Schema. Fields are closed. Day-one checks are structural contradiction checks. See [docs/module-a/README.md](../../module-a/README.md). This plan does not reopen that format.

**Feature ids:** F02, F03, F29.

Generation and verification stay separate. The coding agent receives an approved contract as read-only. It must not edit an approved contract or a critical test to make itself pass. Another model's reading of the request is a proposal, not ground truth. A critical security failure is a block.

## Natural language to a structured contract

The module proposes a contract from the request: requirement ids, observable criteria, and the closed fields. A human approves a version before any agent may rely on it.

**Done when:** a sample request produces a YAML contract that validates against the JSON Schema envelope, and an unapproved draft is refused as the contract for a run.

## Ambiguous, contradictory, or incomplete requirements

Before approval, structural checks flag three defects: a phrase with more than one reading, two claims that cannot both hold, or a missing field the closed schema requires. The draft lists each defect with the requirement id and the sentences involved.

**Done when:** one fixture of each kind is reported, and none of the three can be approved.

## Observable acceptance criteria

Each acceptance criterion names what an observer can see: the input, the action, and the outcome, including a rejected action. A criterion that only praises the result stays incomplete.

**Done when:** a criterion with input, action, and outcome validates, and a criterion with no observation fails validation.

## Preconditions, postconditions, and invariants

Each of these is a named claim with an observation. A precondition is a state that must hold before the action. A postcondition is a state that must hold after a successful action. An invariant is a state that must hold before and after.

**Done when:** a fixture records all three as separate claims, and a claim with no observation fails validation as incomplete.

## Bounds, permissions, states, atomicity, and idempotency

These are named claims. They enter the schema only when a task cannot be stated with the closed fields already decided in [docs/module-a/README.md](../../module-a/README.md). Until that measured gap exists, the contract states the task with the closed fields, and the extra claim stays in the notes outside the schema.

**Done when:** a task that fits the closed fields is rejected if it adds one of these as a new schema field, and a written gap must exist before any of them becomes a field.

## Version and protect approved contracts

An approved contract has a version id and a content hash. A later edit is a new version and needs approval again. The approved bytes remain available. Agents and repair steps receive that version read-only.

**Done when:** two approvals of different bytes get different version ids and hashes, and a run can still load the earlier approved bytes.

## Attempts to change the criteria

During generation, repair, or a retry, a diff to an approved contract, its acceptance criteria, or a critical test is a block. The report names the path, the approved hash, and the attempted hash. Verification keeps using the approved version.

**Done when:** a fixture that rewrites an acceptance line is blocked, the approved hash is unchanged, and the run is not accepted.

## Links from requirements to tests and evidence

Each requirement id maps to one or more test ids and to the evidence report of any run that claims it. Module 4 writes the test result. This module writes the link. A requirement with no test link cannot be marked complete.

**Done when:** a requirement id with a test id and a report row can be traced in both directions, and a requirement with no test link stays incomplete.

## Human approval

A human approves the version when the requirement is critical (security, permission, data loss, money, or an irreversible action) or when structural checks cannot interpret it safely. Silence is not approval. The approver's name and the version id are stored with the hash.

**Done when:** a critical draft and an uninterpretable draft both stay unapproved until that record exists, and a non-critical draft that validates can be approved with the same record.

## Acceptance criteria (checkable)

- [ ] Approved contracts are human-authored YAML and validate against the JSON Schema envelope.
- [ ] Fields stay closed. Structural checks catch contradictions. The format debate stays closed.
- [ ] Ambiguous, contradictory, and incomplete fixtures are reported and cannot be approved.
- [ ] Every acceptance criterion, precondition, postcondition, and invariant has an observation.
- [ ] Bounds, permissions, states, atomicity, and idempotency stay out of the schema until a task cannot be stated with the closed fields.
- [ ] Approved versions keep a version id and a content hash and stay readable.
- [ ] An attempt to change criteria or a critical test during a run is a block.
- [ ] Every requirement id links to a test id and to evidence, or it stays incomplete.
- [ ] Critical and unsafe-to-interpret requirements have a named human approval.

## Evidence

The contract file, its version id, its content hash, the approval record, the defect list, and the requirement-to-test links. A model's summary of the request is not the contract. A green test run does not approve a new version.

## Later

Phase 2 may consume these contracts for planning, AST, and code-to-spec work. Phase 3's teacher, adaptive score, reinforcement learning, and model router do not rewrite an approved contract. New schema fields wait for a task the closed fields cannot state. Genetic search is out of this module.

## Related files

- [docs/module-a/README.md](../../module-a/README.md)
- [docs/plan/modules/01-task-planning.md](01-task-planning.md)
- [docs/plan/modules/03-code-generation.md](03-code-generation.md)
- [docs/plan/modules/04-deterministic-verification.md](04-deterministic-verification.md)
