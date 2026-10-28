# F25 — Model router

- Module: `docs/plan/modules/10-reinforcement-learning.md`
- Phase: 3
- Objective: Choose models by performance, cost, and task type.

## Plan

The router chooses which model writes code. It chooses from measured performance, cost, and task type on this repository. It does not edit acceptance contracts. A public benchmark may only shortlist a model. Rank on this repository's frozen contracts and seeded bugs. A leaderboard position is not a rank here.

Switching is slow on purpose. One syntax fix stays on the same model. The same rule applies to one functional failure: send that failure back to the same model. Switch model only after the same failure returns twice. A new failure is not a second copy of a different failure.

If a learned policy ever proposes the route, reinforcement learning is compared with rules before it replaces them. Until that comparison is won, the route is a written rule: task type, the shortlist, then the rank on local contracts and seeded bugs.

Critical security blocks ignore the router and the score. A critical security failure stays a block on every model and at every score. The router cannot pick a model that skips that block, and it cannot rewrite the contract that imposed it.

Record reliability by model, task type, and repository so the next route can cite a row instead of a preference.

## Acceptance criteria

- Every route stores the shortlist source, the local rank (contracts and seeded bugs), the task type, and the cost figure it used.
- A public benchmark name appears only as a shortlist reason, never as the rank that won.
- The log shows the same model for the first syntax fix and for the first occurrence of a functional failure.
- A model change on a failure cites two occurrences of that same failure.
- A diff under `contracts/` produced by the router invalidates the run.
- A critical security FAIL remains FAIL after routing and after any score is attached.

## Evidence

- Shortlist note, local rank table, and the seeded-bug ids used.
- Failure identity and occurrence count before any switch.
- Contract revision before and after the run, with no router edit.
- The critical block result, stored apart from the route and the score.

## Depends on

- Frozen contracts and a seeded-bug set for this repository.
- Check results that name the model that produced the change.
- F26 cost rows when the route uses price; wall time and call count are enough to start the rule.

## Does not include

- Editing acceptance criteria, contract files, or the pass/fail result.
- Switching model on the first syntax error.
- Treating a public benchmark score as the local rank.
- Overriding a critical security block with a cheaper or higher-scoring model.

## Related

- `docs/plan/modules/10-reinforcement-learning.md`
- F23, F24, F26, F29, F32
- UC-46, UC-47, UC-48, UC-51, UC-21
