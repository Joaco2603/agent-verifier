# F23 — Adaptive learning

- Module: `docs/plan/modules/08-teacher-learning.md`
- Phase: 3
- Objective: Improve selection of tests, strategies, and estimates.

## Plan

Phase 3 starts after a result history exists and a named simpler method has already lost a comparison. Until that comparison is recorded, selection stays on a fixed rule plus the history. Reinforcement learning is compared with those rules before it replaces them. This feature does not train a policy on day one.

Three selections improve, and each one cites the rows it used:

1. Tests. Spend effort on checks with higher expected value from defects found, false alarms, time, and cost. A check that only lifts the pass rate by staying easy is not a better check.
2. Strategies. Compare which models and methods find more defects on the same frozen contracts. Keep a new strategy only when that comparison is written down.
3. Estimates. Replace the optimistic, most likely, and pessimistic duration with measured time, including fixes and retries.

The teacher may recommend the next selection. A learning label requires a reproducible result. Another model's opinion is not ground truth. The teacher does not relabel a failure as a pass, and it does not edit an approved contract.

A critical security block is outside this selection. Routing a different model, or a low score, does not clear it.

## Acceptance criteria

- Each selection names the rule or the compared policy, the history rows it used, and the checks or estimate it changed.
- A recommendation with no reproducible defect, false alarm, duration, or cost is not stored as a learning label.
- An updated estimate cites measured durations. It is not a fresh guess written as the same three numbers.
- A policy that increases passes by choosing easier checks loses the comparison.
- No run under this feature writes under `contracts/` or changes an acceptance result.

## Evidence

- History rows: task, decision, defect or false alarm, time, and cost.
- The comparison against the fixed rule, with defects found, false alarms, time, and cost kept as separate numbers.
- The contract revision the checks ran against, unchanged by the selector.

## Depends on

- Phase 1 results: pass, fail, unknown, escape rate, false alarms, cost, and requirement coverage.
- Experience memory of tasks, decisions, defects, and fixes.
- Duration estimates recorded before measured time replaces them.
- Frozen contracts the selector is not allowed to edit.

## Does not include

- Training a reinforcement-learning agent before the rule comparison exists.
- Editing acceptance contracts or critical tests.
- Using a blended quality score as the selection target.
- A live supervisor on the coding agent. That waits until the pre-commit gate has reliability records.

## Related

- `docs/plan/modules/08-teacher-learning.md`
- `docs/plan/modules/10-reinforcement-learning.md`
- F20, F22, F24, F25, F30
- UC-37, UC-40, UC-49, UC-50
