# F24 — Reinforcement learning

- Module: `docs/plan/modules/10-reinforcement-learning.md`
- Phase: 3
- Objective: Optimize decisions with rewards based on verified results.

## Plan

Do not train on day one. The first policy is a fixed set of rules plus a result history. Reinforcement learning is compared with those rules before it replaces them. The comparison is against the fixed strategy, and a contextual bandit is the smaller learner allowed in that same comparison. A learned policy ships only when the recorded comparison beats the fixed strategy on verified outcomes.

The decision cycle, once that comparison exists, is a sequence of choices rather than a trainer:

1. Receive a task and read its duration estimate.
2. Select an agent and a model, and choose which checks to run.
3. Read the check results. Do not treat another model's opinion as the reward.
4. Compute a reward from verified results: defects found, false alarms, time, and cost.
5. Update the selection strategy and apply it to a later task.
6. Compare that later task with the fixed strategy again.

Actions the policy may learn to pick: which model, how far to split a task, which tests to prioritize, when to fuzz, when to mutation-test, when to ask a human, and when to change strategy after a failure.

Penalize a policy that maximizes easy passes. A higher pass rate from choosing easy checks is a penalty, not a reward. Defects found stay separate from the pass rate.

A critical security block ignores the policy, the router, and the score. The policy must not edit acceptance contracts.

## Acceptance criteria

- Day-one runs use rules and history. No learned weights are applied before a comparison exists.
- The comparison report shows the fixed strategy and the candidate on the same tasks, with defects found, false alarms, time, and cost as separate columns.
- A candidate that raises the pass rate by selecting easier checks is marked as penalized and does not replace the rules.
- The reward row cites a reproducible result. An explanation from a model is not the reward.
- No update writes under `contracts/`.

## Evidence

- The rule set and the history rows used before any learned update.
- The comparison table against the fixed strategy.
- The reward inputs: defect, false alarm, time, and cost, each tied to a contract revision and a raw result.

## Depends on

- F23 selection records, or the same history those records use.
- Frozen contracts and deterministic check results.
- A cost figure for the task, even if the full price ledger arrives with F26.

## Does not include

- Training from the first task.
- A reward defined as pass rate, or as a single blended score.
- Waiving a critical security failure because the policy prefers another check.
- Using the policy as a correctness oracle.

## Related

- `docs/plan/modules/10-reinforcement-learning.md`
- `docs/plan/modules/08-teacher-learning.md`
- F23, F25, F21, F33
- UC-45, UC-49, UC-50
