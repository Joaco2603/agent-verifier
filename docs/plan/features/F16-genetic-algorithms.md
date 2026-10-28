# F16 — Genetic algorithms

- Module path: `docs/plan/modules/06-integration-search.md`
- Phase: 3
- Objective: Explore complex combinations if they beat simpler alternatives.

Genetic search looks for failing integration scenarios. It is not a correctness oracle. Fitness ranks candidates. A reproduced check decides the failure. Until the hourly comparison below is stored, the build contains the Phase 2 methods only.

## Plan

A candidate is a scenario the integration harness can run: steps, faults, and a schedule. Fitness uses four recorded signals: executions (what ran and what failed a check), new behavior covered (coverage the run measured), relevance (the input touches the change under review), and cost (time and cases). A missing signal leaves fitness uncomputed. Selection and variation use those scores. Store the parents and the four signals with the candidate.

Keep the method only when confirmed failures per hour are higher than coverage-guided fuzzing, higher than property-based tests, and higher than random search, on the same integration surface and the same accounting hour. A tie, or a loss to any of the three, means the search stays out. Confirmed means a second run of the stored command fails the same check. The four rates are stored beside the keep-or-drop decision.

Every hit remains a candidate until it passes through reproduction and minimization. A high fitness score does not mark code correct and does not set a state.

## Acceptance criteria

- Fitness cites executions, coverage, relevance, and cost. One missing signal leaves that candidate unscored.
- A run that does not beat all three baselines stores drop, and the Phase 2 methods remain the ones in use.
- A run that beats fuzzing, property-based tests, and random search stores keep, with all four rates.
- A high-fitness candidate with no reproduced failure does not change a check state.
- The same seed, budget, surface, and hour produce the same keep-or-drop decision on replay.

## Evidence

Recompute confirmed failures per hour from the archived executions. The four rates and the second-run results are the evidence. A model explanation of the population is not a rate, and genetic search is not a correctness oracle.

- Run the four methods for the recorded hour. Archive confirmed failures, elapsed time, and the rate for each.
- Drop any failure the harness does not repeat. Archive the repeat result.
- Archive coverage from the harness for the new-behavior term.
- Archive the keep-or-drop row next to the three baseline rates.

## Depends on

- F14 and F15, including coverage-guided fuzzing, as the harness and one baseline.
- Property-based tests and random search on the same surface, as the other two baselines.
- `docs/plan/modules/06-integration-search.md` for the hourly comparison.

## Does not include

- Shipping genetic search before that comparison exists.
- Treating fitness, relevance, or cost as proof the scenario is correct.
- Writing PASS or FAIL (F18), or editing an approved contract.
- A blended product score (F21). This feature stores four rates and a keep-or-drop decision.

## Related

- `docs/plan/modules/06-integration-search.md`
- F14, F15, F18, F21
- UC-41, UC-42
