# F26 — Token accounting

- Module: `docs/plan/modules/11-tokens-cost-observability.md`
- Phase: 2
- Objective: Measure consumption, latency, and cost per operation.

## Plan

Phase 2 builds the ledger that later scores and economic checks read. Phase 1 may already log the model name and wall time. That log is not this ledger.

Each operation row records:

- Input tokens and output tokens.
- Reasoning tokens when the provider reports them. Absence is an empty field, not a zero presented as a measurement.
- Price by model, agent, task, and project, using the provider's reported price for that call.
- Latency, call count, retries, and tool use.
- Test and execution cost for the checks that ran with the call.
- The budget ceiling that applied, and whether the run stopped at it.

Rows are additive. A task total is the sum of its operation rows, not a new estimate.

Tokens, cost, and model training are different jobs. This feature counts and prices calls. It does not train a model, and it does not choose the next model. Training data, gradients, and fine-tunes stay out of the ledger.

Ponyfill and Capy are unidentified. This plan does not assign them APIs, vendors, or capabilities. Ponyfill usually means a JavaScript compatibility shim, not a token counter. Ask for the exact product names or links before any integration.

## Acceptance criteria

- Every model call that this phase prices has one row with tokens, latency, and price, or an explicit gap naming which of those the provider omitted.
- A task total equals the sum of its rows for tokens, latency, and price.
- A missing reasoning-token field is not stored as zero.
- The ledger has no training-run id and no weight version written by this feature.
- No row names a product capability for the two unidentified names above.

## Evidence

- The operation row and the provider fields it was copied from.
- The budget that was in force, and the row that crossed it if the run stopped.
- A sample task whose total matches the sum of its rows.

## Depends on

- A call log that already names the model and the wall time.
- Provider-reported token counts and prices. This feature does not invent a tokenizer to fill a gap.
- The operation id shared with traces in F27.

## Does not include

- Training, fine-tuning, or a reward update.
- Choosing a model (F25) or deciding that a cost was worth the defects (F33).
- A full observability stack of traces, logs, and version pins (F27).
- Integration of unidentified products.

## Related

- `docs/plan/modules/11-tokens-cost-observability.md`
- F27, F33, F25, F30
- UC-60
