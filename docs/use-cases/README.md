# Use-case index

The full plan, with one file per module and one file per feature, is in [docs/plan/README.md](../plan/README.md). This page is the earlier one-line map.

One file. Each use case is one functionality from the verification-gateway design, written once, with the phase when it earns a build.

The coding agent may generate code. It is not the authority that decides the code is correct. Phase 1 is a check that runs before commit, against contracts the agent cannot edit. Later phases start only after the earlier phase has a measured result.

`docs/module-a/README.md` is the contract-format decision already written. This index does not reopen it.

| Phase | Meaning |
| --- | --- |
| 1 | First gate: frozen contracts, example checks, a risk block, and a report of evidence. |
| 2 | Extra evidence. Starts after Phase 1 has escape rate, false alarms, cost, and coverage. |
| 3 | Search, models, and routing. Starts only when a named simpler method has already lost a comparison. |
| Hold | Listed so it is not forgotten. No schema entry and no build until a Phase 1 task cannot state the outcome without it. |

## Contracts

| ID | Use case | Phase |
| --- | --- | --- |
| UC-01 | Propose a contract from a natural-language requirement, and leave it unapproved until a person accepts it. | 1 |
| UC-02 | Accept only a property template the current schema already names. | 1 |
| UC-03 | Reject a contract whose example input breaks its own preconditions, before any code runs. | 1 |
| UC-04 | Approve a revision and treat the git blob of that file as the frozen oracle. | 1 |
| UC-05 | Invalidate a run when the coding agent edits `contracts/`. | 1 |
| UC-06 | Split a vague requirement into observable checks, and write the rest in `limitations`. | 1 |
| UC-07 | Name the minimum evidence a requirement needs before it can pass. | 1 |
| UC-08 | Keep contracts in their own tree, outside the generated source. | 1 |

## Checks on a frozen contract

| ID | Use case | Phase |
| --- | --- | --- |
| UC-09 | Run the contract's example inputs and compare them to the declared observables. | 1 |
| UC-10 | Tie each example to a requirement id so a failure names the requirement, not only the test. | 1 |
| UC-11 | Run `bounded_output` on a declared numeric observable. | 1 |
| UC-12 | Finish each check as PASS, FAIL, UNKNOWN, or NOT_APPLICABLE. | 1 |
| UC-13 | Attach the contract revision and the raw result to the decision. | 1 |
| UC-14 | Let a model explain the report, and keep that explanation from changing the result. | 1 |
| UC-15 | Record UNKNOWN when the suite cannot see production concurrency, infrastructure, or live data. | 1 |
| UC-16 | Summarize how many requirements passed, failed, or were too vague to check. | 1 |

## Risk

| ID | Use case | Phase |
| --- | --- | --- |
| UC-17 | Score a change from criticality, impact, security exposure, missing evidence, and failure history, and label the weights as uncalibrated. | 1 |
| UC-18 | Force security checks on a permission or admin change at any score. | 1 |
| UC-19 | Run a smaller suite when the score is low and no forced check applies. | 1 |
| UC-20 | Stop for a person when the score is high and the evidence is missing. | 1 |
| UC-21 | Block a critical security failure at any score and with any model. | 1 |

## Broader evidence

| ID | Use case | Phase |
| --- | --- | --- |
| UC-22 | Add cases for empty, null, negative, and boundary inputs on a raised risk band. | 2 |
| UC-23 | Run a property-based check when a template states a general rule, not one example. | 2 |
| UC-24 | Mutation-test the implementation and record the mutants that survive. | 2 |
| UC-25 | Mutation-test the contract and record survivors, without treating that as proof the contract matches the user. | 2 |
| UC-26 | Run static checks for known classes such as injection, XSS, and missing authorization. | 2 |
| UC-27 | Re-run the frozen contracts of behavior the diff can affect. | 2 |
| UC-28 | Run integration checks along the dependency path of the files that changed. | 2 |
| UC-29 | Double-check a high-risk change with a second mechanism, not a second copy of the same model call. | 2 |
| UC-30 | Extract facts from the AST of a function without reading comments or the README. | 2 |
| UC-31 | Follow a value through the data flow before claiming that a check is implemented. | 2 |
| UC-32 | Turn those facts into a structured behavior with fields for precondition, effect, and failure. | 2 |
| UC-33 | Compare the requirement, the structured behavior, and the README, and record a contradiction. | 2 |
| UC-34 | Ignore a word mismatch when the structured behaviors are the same. | 2 |
| UC-35 | Report complexity and convention signals, and keep them out of the pass/fail decision. | 2 |
| UC-36 | Fuzz a changed function when the risk band calls for it. | 2 |

## Splitting work

| ID | Use case | Phase |
| --- | --- | --- |
| UC-37 | Estimate a task with an optimistic, a most likely, and a pessimistic duration. | 2 |
| UC-38 | Split a task when the estimate, the variance, or the criticality is high, or when the result cannot be checked on its own. | 2 |
| UC-39 | Check a subtask's contracts before the next subtask starts. | 2 |
| UC-40 | Replace the estimate with measured time, including fixes and retries. | 2 |

## Search, models, and routing

| ID | Use case | Phase |
| --- | --- | --- |
| UC-41 | Search integration conditions with a genetic algorithm whose score comes from executions, new behavior covered, relevance, and cost. | 3 |
| UC-42 | Keep that search only if it finds more failures per hour than fuzzing, property tests, or random scenarios. | 3 |
| UC-43 | Flag a subtle mismatch between an agent claim and the evidence already collected. | 3 |
| UC-44 | Use a deterministic rule when the claim and the check results already contradict each other. | 3 |
| UC-45 | Compare a divergence model with rules and a simple classifier before acting on the model. | 3 |
| UC-46 | Shortlist models with public benchmarks, then rank them on this repository's frozen contracts and seeded bugs. | 3 |
| UC-47 | Ask the same model to fix one syntax error or one functional failure, and switch model only after the same failure returns twice. | 3 |
| UC-48 | Forbid the model router from editing acceptance contracts. | 3 |
| UC-49 | Learn which checks to spend effort on from defects found, false alarms, time, and cost. | 3 |
| UC-50 | Penalize a policy that raises the pass rate by choosing easy checks. | 3 |
| UC-51 | Record reliability by model, task type, and repository. | 3 |
| UC-52 | Supervise a live coding agent only after the pre-commit gate has those records. | 3 |

## Templates waiting for a task

| ID | Use case | Phase |
| --- | --- | --- |
| UC-53 | State idempotency as "the same key must not apply the effect twice," not as "the same call returns the same object." | Hold |
| UC-54 | State that a declared total is conserved across the operation. | Hold |
| UC-55 | State that increasing one input does not decrease a declared output. | Hold |
| UC-56 | State that a declared inverse operation restores the prior state. | Hold |
| UC-57 | State that a compound operation completes or leaves the declared state unchanged. | Hold |
| UC-58 | State that an actor without a declared permission cannot perform the operation. | Hold |
| UC-59 | State the allowed transitions of a declared state machine. | Hold |

## Measures that gate the next phase

| ID | Use case | Phase |
| --- | --- | --- |
| UC-60 | Measure defect escape, false alarms, verification cost, and requirement coverage on each phase. | 1 |
| UC-61 | Measure the failures this gate catches among the ones the agent's own tests pass. | 1 |
| UC-62 | Build a runner only if the Module A rule is met: at least 10 of those catches, at most 2 false accepts, at most 3 weak contracts, and a median approval time of 25 minutes or less. | 1 |
| UC-63 | Ship the first product as a verifier that runs before commit. | 1 |
