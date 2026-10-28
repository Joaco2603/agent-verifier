# Module 4 — Deterministic verification

**Phase when it earns code:** 1, for unit tests, integration of the changed path when a harness exists, regression of frozen contracts, contract validation, and critical blocks.

Property-based tests, fuzzing, mutation, concurrency, transactions, and formal checks are specified here with the result that would justify them. They wait for that result. Complexity waits for a measured result on the controlled benchmark: escape rate, false alarms, cost, and coverage.

**Feature ids:** F08, F09, F10, F31.

The verifier runs before commit, outside the agent's writable workspace. A passing test is not a proof of correctness. Another model's opinion is not ground truth. The coding agent must not edit approved contracts or critical tests to pass. A critical security failure is a block. A good score elsewhere does not clear it.

| Check | When it earns code |
| --- | --- |
| Unit, integration if a harness exists, regression, contract validation, security, authorization, critical blocks | Phase 1 |
| Static analysis, property-based tests, fuzzing, mutation, concurrency, transactions, formal checks | After the justifying result below |

## Unit tests

Every behavior the contract names has a unit check that records pass or fail against that requirement id. The suite runs where the agent cannot edit it.

**Done when:** one failing unit check produces a report that names the check, the requirement id, and the failure, and the run is not accepted.

## Integration tests

Phase 1 runs integration only for the changed path, and only when a harness already exists. A missing harness is recorded. The other phase 1 checks still run.

**Done when:** a repo with a harness runs it on the changed path and records the result, and a repo without a harness records the absence and does not treat that absence as a pass.

## Regression tests

Regression checks the observations of frozen approved contracts. A break in a frozen observation fails the run. New behavior needs a new approved version from module 2.

**Done when:** a change that violates a frozen observation fails, and rewriting the regression to fit the new code is blocked as a critical-test edit.

## Static analysis

Static analysis earns code when the phase 1 benchmark shows an escaped defect on the changed path that unit, integration, regression, and contract checks all missed, and a named analyzer reports that defect. The same suite records the analyzer's false-alarm count.

**Done when:** that escape and that false-alarm count are written on the benchmark, or the report says the analyzer is not yet justified. A clean analyzer run is not a proof of correctness.

## Contract validation

Validation checks the run's contract against the JSON Schema envelope, the closed fields, and the structural contradiction checks in [docs/module-a/README.md](../../module-a/README.md).

**Done when:** an invalid or contradictory contract fails validation before tests are treated as acceptance, and a valid frozen contract passes this check.

## Property-based testing

A property test earns code when an approved invariant already names input bounds and example tests do not cover those bounds. The first property must fail on a known bad implementation in the benchmark.

**Done when:** that gap and that failing known-bad case are recorded, or the report says property tests are not yet justified.

## Fuzzing

Fuzzing earns code when the benchmark shows a crash, hang, or sanitizer finding on a parser or boundary that enumerated examples missed.

**Done when:** that finding is recorded against the example suite it escaped, or the report says fuzzing is not yet justified. A fuzz run that finds nothing does not become a permanent suite by default.

## Mutation testing

Mutation earns code when the phase 1 suite passes while a small, reviewed mutation of the implementation still passes. The score measures suite strength.

**Done when:** that surviving mutation is recorded, or the report says mutation is not yet justified. The score is not a proof of correctness.

## Security tests

A check the contract marks as a critical security claim fails closed. The block remains when every other check passes.

**Done when:** a fixture with a critical security failure is rejected, the report still shows the other results, and those results do not clear the block.

## Authorization checks

When the contract names a permission, an action outside that permission is a critical block. A critical task with no permission claim stays blocked until module 2 records human approval of that omission.

**Done when:** an out-of-permission action blocks the run, and a critical task missing its permission claim blocks the run as well.

## Concurrency tests

A concurrency check earns code when a requirement names shared state or ordering, and the benchmark can show two schedules with different observable results. The check uses a fixed schedule.

**Done when:** those two schedules and their different observations are recorded, or the report says concurrency checks are not yet justified.

## Transaction and consistency checks

These earn code when an approved contract names atomicity or a consistency claim, and a crash between two writes is observable on the benchmark.

**Done when:** the interrupted case shows the claim holding or the run blocking, or the report says these checks are not yet justified.

## Formal verification

A formal check earns code when a closed property is small enough to decide, and tests and the contract checker disagree on a benchmark case. Phase 1 keeps the structural envelope checks already decided. This does not add a solver to day one.

**Done when:** that disagreement and the size bound are recorded, or the report says formal verification is not yet viable.

## Automatic blocks on critical failures

Critical failures block commit. The set includes a failed critical security or authorization check, a contract-validation failure, an edit to an approved contract or a critical test, and any other failure the contract marks critical. Other scores stay visible beside the block.

**Done when:** each of those fixtures is rejected, the report lists the block reason, and no numeric score clears it.

## Acceptance criteria (checkable)

- [ ] Phase 1 runs unit tests, integration on the changed path when a harness exists, regression of frozen contracts, contract validation, and critical blocks.
- [ ] A missing integration harness is reported and is not a pass.
- [ ] Security and authorization failures block even when other checks pass.
- [ ] The agent cannot edit the suite, the frozen contract, or a critical test to obtain a pass.
- [ ] Static analysis, property-based tests, fuzzing, mutation, concurrency, transactions, and formal checks each name the benchmark result that would justify them, and they have no suite until that result exists.
- [ ] A passing report is labeled as check evidence, not as a proof of correctness.
- [ ] Another model's opinion is absent from the accept decision.

## Evidence

The verification report: requirement id, check name, result, block reason, contract hash, and benchmark notes for any technique still waiting. Module 3's change log shows what was verified. Together they support a commit decision. They do not prove the program correct.

## Later

The seven waiting checks start only after their justifying result on escape rate, false alarms, cost, and coverage. Phase 2 adds AST, code-to-spec, PERT, and risk on top of this report. Phase 3's teacher, adaptive score, reinforcement learning, and model router may read the report. They do not override a block. Genetic search over checks waits until it beats the phase 1 suite on that same benchmark.

## Related files

- [docs/module-a/README.md](../../module-a/README.md)
- [docs/plan/modules/02-requirements-contracts.md](02-requirements-contracts.md)
- [docs/plan/modules/03-code-generation.md](03-code-generation.md)
- [docs/plan/modules/01-task-planning.md](01-task-planning.md)
