# F33 — Economic evaluation

- Module: `docs/plan/modules/11-tokens-cost-observability.md`
- Phase: 2
- Objective: Measure whether the gains justify the compute cost.

## Plan

Phase 2 asks a cost question the first benchmark cannot finish alone. Phase 1 can show extra defects and a partial cost. This feature answers whether those gains justify the compute cost, and it needs the token and test-cost ledger to do that.

The ratio is defects found per cost. Cost is the sum of model-call price and test execution cost from the ledger, for the same change. Defects found are the verified defects the gate caught, including defects the agent's own tests passed. Pass rate per cost is not the ratio. A run that looks cheap because it chose easy checks is not an economic win.

Keep the ratio beside the other results. Do not fold it into one score that can hide a critical failure behind a low price. A critical security block ignores the router and the score, and a low cost does not clear it either.

Reinforcement learning is compared with rules before it replaces them. This feature does not train that policy. It only publishes the cost side a later comparison would read. If the ledger has a gap for a call, the ratio is incomplete and is reported as incomplete.

## Acceptance criteria

- A completed evaluation cites ledger rows for tokens and for test cost, and the defect ids in the numerator.
- The published figure is defects found per cost. Pass rate per cost is not published as the result.
- An incomplete ledger produces an incomplete evaluation, not a zero-cost success.
- A critical FAIL remains visible on the same report. It is not cancelled by a favorable ratio.
- The report separates this ratio from any later blended score.

## Evidence

- Ledger row ids, the summed cost, and the defect ids.
- The denominator's parts: model-call price and test execution cost.
- The incomplete flag when a priced call or a test run has no row.

## Depends on

- F26 token and test-cost ledger.
- F30 catch list, or the same defect records that list uses, so the numerator is verified defects.
- Contract revisions so a defect id points at a frozen oracle.

## Does not include

- A price the ledger does not contain.
- Pass rate per cost, or a single score that mixes this ratio with unrelated wins.
- Training a model, routing a model, or a payment flow.
- A decision to sell the product. F34 reads the cost. It is a separate study.

## Related

- `docs/plan/modules/11-tokens-cost-observability.md`
- `docs/plan/modules/09-scoring-engine.md`
- F26, F30, F34, F24
- UC-60, UC-61
