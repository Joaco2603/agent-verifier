# Module 1 — Task planning

**Phase when it earns code:** 2.

Phase 1 is a verifier that runs before commit: contracts, deterministic checks, evidence reports, a controlled benchmark, and the minimum agent boundary those need. This module earns code only after that benchmark has a measured result. It plans duration, scope, and named evidence. Correctness stays with module 4.

**Feature ids:** F04, F05, F06.

PERT estimates duration. It does not estimate correctness. An estimate that has not been compared with actual time, including fixes and retries, is subjective.

Generation and verification stay separate. A passing check is evidence that the check ran. It is not a proof of correctness. Another model's opinion is not ground truth. The coding agent leaves approved contracts and critical tests unchanged. A critical security failure blocks the subtask. A shorter schedule leaves that block in place.

## PERT three-point estimate

Each task stores three durations in one unit: optimistic (O), most likely (M), and pessimistic (P).

Expected duration is `E = (O + 4M + P) / 6`. Variance is `((P - O) / 6)^2`.

**Done when:** a fixture with fixed O, M, and P yields those two numbers from the formulas above, and the report labels both as duration estimates.

## Automatic split into subtasks

The module proposes a split from the task and its contract. Each subtask has its own scope and its own named evidence, so it can be checked alone. Work that cannot be checked alone stays one task. A human accepts the split before it binds the agent.

**Done when:** a sample task yields subtasks that each name a scope and an evidence item, and a sample that cannot be checked alone remains a single task.

## Dependency graph and critical path

A dependency is a directed edge: a subtask starts only after the subtasks it names are complete. The critical path is the path with the largest sum of expected durations. The path is a schedule.

**Done when:** a fixture graph names that critical path from the E values, and a cycle or a missing predecessor is reported in place of a path.

## Uncertainty

Ambiguous requirements and high-risk areas are named risks on the task. They widen P. They stay risks, not a correctness score. While module 2 still marks a requirement ambiguous, contradictory, or incomplete, this module withholds a ready E for every subtask that depends on it.

**Done when:** an open ambiguity produces no ready E, and a named high-risk area is stored beside a wider P.

## Iteration plan

Every subtask lists four steps in this order: generate, verify, fix, integrate. Generate and fix belong to the coding agent. Verify belongs to module 4. Integrate runs only after verify reports no critical block.

**Done when:** the plan shows those four steps in that order, and integrate is absent while verify still has a critical block.

## Continuous re-estimate

After every attempt, store actual time. Count failed attempts, fixes, and retries. Set a new O, M, and P from that record, recompute E and variance, and keep the previous E beside the new E.

**Done when:** a fixture with two attempts, one of them a retry, changes E, retains both estimates, and still marks the estimate subjective until at least one actual duration is stored.

## Scope control

Each subtask names the components and file paths it may touch. That list is the whole scope. The coding agent cannot add a path. Module 3 enforces the allow-list. This module emits a usable list only when it is non-empty and narrower than the repository.

**Done when:** every emitted subtask has that allow-list, and a review fixture rejects an empty list or a list that means the whole repository.

## Completion criteria as named evidence

A subtask is complete when every evidence name on it is present and tied to the requirement ids it claims. An agent sentence that the work is done does not count. Present evidence still does not prove correctness.

**Done when:** a missing evidence artifact leaves the subtask incomplete, and a full set of named artifacts marks it complete even when the agent's summary disagrees.

## Acceptance criteria (checkable)

- [ ] O, M, P, `E = (O + 4M + P) / 6`, and `((P - O) / 6)^2` match a hand-computed fixture.
- [ ] The report calls E a duration estimate and marks an estimate with no actuals as subjective.
- [ ] Each split subtask can be checked alone; otherwise the task stays whole.
- [ ] The graph yields a critical path, or it records a cycle or a missing predecessor.
- [ ] Ambiguity and high-risk areas are named, and ambiguity withholds a ready E.
- [ ] The iteration order is generate, verify, fix, integrate.
- [ ] Re-estimates include fixes and retries and keep the previous E.
- [ ] Scope is an explicit allow-list the agent cannot widen.
- [ ] Completion is the presence of named evidence.
- [ ] This module adds no code before the phase 1 benchmark has a measured result.

## Evidence

The plan record holds O, M, P, E, variance, risks, the graph, the critical path, the allow-list, the four iteration steps, and the evidence names. Actual durations sit beside estimates. Module 4 holds the verification report. Commentary from a model on the plan is not ground truth.

## Later

Phase 3 owns the teacher, the adaptive score, reinforcement learning, and the model router. Those inputs stay out of E. Genetic search over plans waits until it beats a simpler search on the same duration error and the same benchmark cost. The product shape remains a verifier before commit.

## Related files

- [docs/plan/modules/02-requirements-contracts.md](02-requirements-contracts.md)
- [docs/plan/modules/03-code-generation.md](03-code-generation.md)
- [docs/plan/modules/04-deterministic-verification.md](04-deterministic-verification.md)
- [docs/module-a/README.md](../../module-a/README.md)
