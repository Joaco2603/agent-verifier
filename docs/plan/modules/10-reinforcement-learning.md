# Module 10 — Reinforcement learning

Phase 3. Day one uses written rules plus a result history. A contextual bandit, or a reinforcement-learning policy, is compared later against that fixed strategy. The rules stay in force until the comparison passes. This file describes the cycle as a plan. It names no algorithm, library, or API. Feature ids: F23, F24, F25.

## Shared rules

- Reward comes from verified outcomes: defects found, false alarms, time, and cost. Those outcomes stay recorded separately.
- A policy that only picks easy checks is penalized. A higher pass rate from easier checks is a penalty.
- A critical failure stays a block outside any reward total. A fast or cheap run does not offset it.
- The router may change which model writes code. It must not edit acceptance contracts.
- Another model's opinion is not the reward. A learning label needs a reproducible result.

## Cycle

### Receive a task

Take the task with its acceptance contract and its duration estimate. The contract is an input. The cycle does not revise it.

### Estimate with PERT

Read optimistic, most likely, and pessimistic time from module 1, and keep all three. Module 9 later scores that estimate against elapsed time, including fixes and retries. The cycle does not replace the three judgments with one hopeful number.

### Select an agent and a model

Choose an agent and a model under the rules, using history once history exists. Until the comparison below passes, the route is a written rule: task type, a shortlist, then rank on this repository's frozen contracts and seeded bugs. A public benchmark may only shortlist a model.

### Choose checks

Choose which checks to run, including which to run first. The rules name the checks a task requires. The policy may order and add checks. It may not drop a required check, and it may not drop a hard check only because an easy check is available.

### Read results

Read verified results: defects found, false alarms, time, cost, regressions, and contract results. An unverified claim is not a result.

### Compute a reward from verified results

Build the reward from those verified outcomes. Keep each outcome in the record. A learning signal may combine them for the update step, and the stored record still shows each one. The signal penalizes a policy that only picks easy checks. A critical failure does not enter the signal as a term other wins can cancel.

### Update the selection strategy

Update which agent, model, split, and checks the strategy will prefer next time. Skip the update when the evidence is missing, not independent, or not reproducible. A block on evidence leaves the previous strategy in place.

### Apply it later

Use the updated strategy on a later task of a similar kind. The current task keeps the strategy it started with. One task does not rewrite its own rules halfway through to improve its reward.

### Compare it to a fixed strategy

On the same kind of task, compare the learned strategy with the fixed strategy. Report defects found, false alarms, time, and cost separately. Publish the comparison beside the two strategies. Do not collapse it into one score.

## What the policy may learn

### Which model

Which model to assign for a class of task, from measured performance, cost, and task type. One syntax error goes back to the same agent and the same model. The first functional failure goes back to the same model as well. Switch model only after the same failure returns twice. A different failure is not the second copy. A model change still leaves the acceptance contract untouched.

### How far to split a task

How finely to split work. A fine split spends more calls. A coarse split can hide a failed part inside a larger pass. Each slice keeps the acceptance checks that apply to it.

### Which tests to prioritize

Which tests to run first when time or budget is tight. Required tests still run. Priority is order, plus extra tests, within the budget module 12 caps. F23's test choice cites defects found, false alarms, time, and cost. A check that only lifts the pass rate by staying easy is not a better check.

### When to fuzz

When a task warrants fuzzing, judged by defects found against time and cost. Always skipping fuzz on tasks the rules mark as fuzz candidates counts as easy-only selection and is penalized.

### When to mutation-test

When a task warrants mutation testing, on the same terms as fuzzing. A suite that never kills mutants is not evidence that mutation testing was unnecessary.

### When to ask a human

When to stop and ask a person. The policy may learn that pause. It does not learn to skip the human approval module 12 requires for critical operations.

### When to change strategy after a failure

When a failure should change the next selection. The same failure twice allows a model switch. A single syntax error returns to the same agent for a correction. The change is a new selection on a later step. It is not an edit to the contract, and it stops when the retry or spend cap is reached.

## Comparison that must pass

Reinforcement learning replaces the rules only after this comparison passes: on held-out tasks, the learned policy beats the fixed strategy on verified defects found, false alarms, time, and cost, reported separately, with the easy-check penalty applied, and with every critical failure still a block outside the reward. Until that comparison passes, the rules plus the result history remain the strategy that runs.

A tie, a win on cost alone, or a win that depends on skipping hard checks leaves the rules in place. Module 8 may recommend a selection from the same history. That recommendation does not replace the rules by itself.

## Acceptance criteria

- [ ] Day one runs the written rules and appends verified results to history. No bandit and no reinforcement-learning policy selects actions on day one.
- [ ] A replay of the cycle shows each step above, in order, with the contract identical at the end.
- [ ] One syntax error, and the first functional failure, stay on the same model. A model change cites two occurrences of that same failure.
- [ ] A policy that selects only easy checks receives the penalty, even if time and cost look better.
- [ ] Replacement of the rules is refused while any compared outcome is missing, while a critical block occurred, or while the learned policy does not beat the fixed strategy on the separate verified outcomes.
- [ ] A diff under `contracts/` produced by the router or by a policy invalidates the run.

## Evidence

A reviewer can show the rule set used on day one, the history rows appended, and the absence of a learned policy in that run. For the later comparison, a reviewer can show the fixed strategy, the candidate policy, the separate outcome columns, the easy-check penalty, and the decision to keep or replace the rules.

## Later

The metrics the reward reads are defined in module 9 and stay independent. Token, price, and latency figures come from module 11. Caps on retries, spend, and human approval of critical operations stay in module 12, including after a policy is allowed to select.

## Related files

- `docs/plan/modules/08-teacher-learning.md` — F23 recommendations that still wait on this comparison.
- `docs/plan/modules/09-scoring-engine.md` — separate metrics the reward must not collapse.
- `docs/plan/modules/11-tokens-cost-observability.md` — time and cost outcomes.
- `docs/plan/modules/12-security-audit.md` — contract protection, approval, and retry and spend limits.
- `docs/plan/features/F24-reinforcement-learning.md` — verified reward and the fixed-strategy comparison.
- `docs/plan/features/F25-model-router.md` — route by task type, local rank, and the two-failure switch.
