# F29 — Contract protection

- Module: `docs/plan/modules/02-requirements-contracts.md`
- Phase: 1
- Objective: Stop the agent from changing its own acceptance criteria.

## Plan

The coding agent may read a contract. It may not edit `contracts/`. After a person approves a revision, the git blob of that file is the frozen oracle for the run. A diff under `contracts/` after approval invalidates the run. The invalidation covers any author: the coding agent, the model router, the teacher, or a scoring policy.

A real change needs a new revision and a new human approval. The new file is a new oracle. It does not revive the invalidated run. The previous revision stays the oracle for any run that already started against it.

The router must not edit contracts. Reinforcement learning is compared with rules before it replaces them, and neither the rules nor a later policy may rewrite an acceptance criterion to obtain a pass. Detecting an edit is the feature. Interpreting the prose of the contract is not.

Critical security blocks ignore the router and the score. Weakening a critical contract by editing it is an invalid run, not a lower score.

## Acceptance criteria

- An approved contract with no later diff under `contracts/` remains the oracle for the run.
- Any diff under `contracts/` after approval marks the run invalid before a pass can be reported.
- The invalid run is not repaired by committing the agent's edit. Repair is a new revision plus a new human approval, then a new run.
- A router, teacher, or score update that touches `contracts/` is the same invalidation.
- The report names the approved blob and the diff that broke it.

## Evidence

- Approved revision, approver, and blob id at the start of the run.
- A clean tree under `contracts/` at the decision, or the diff that invalidated the run.
- The new revision and the new approval when a human actually changes a contract.

## Depends on

- Human approval of a contract revision before code is graded against it.
- Contracts stored in their own tree, outside generated source.
- A diff of `contracts/` that the checker can see at decision time.

## Does not include

- Authoring the contract schema or adding property templates.
- Deciding that the prose matches the user's intent. That is the approval, not this guard.
- Mutation-testing the contract text.
- A billing or product change when the contract is about price.

## Related

- `docs/plan/modules/02-requirements-contracts.md`
- `docs/module-a/README.md`
- F03, F25, F28, F32
- UC-04, UC-05, UC-08, UC-48
