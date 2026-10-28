# Module 11 — Tokens, cost, and observability

Phase 2, because later scores need the ledger. Phase 1 may log the model name and the wall time. That log is not a full cost model. Feature ids: F26, F27, F33.

## Phase boundary

Phase 1 writes two fields when a model call happens: the model name, and the wall time. Those fields support traceability. They are not prices, token counts, or a cost score.

Phase 2 adds the ledger and the observation path below. Module 9 leaves Cost Efficiency uncomputed until the matching ledger rows exist. A gap in the ledger makes F33 incomplete. It does not become a zero-cost success.

## Ledger

Each item is its own record. Rows are additive: a task total is the sum of its operation rows. A rollup may sit beside the parts. The rollup does not replace them, and it does not hide a critical finding recorded elsewhere.

### Input tokens

The count of tokens sent in, as the provider reports that count for the call. If the provider does not report it, the field stays empty. This feature does not invent a tokenizer to fill the gap.

### Output tokens

The count of tokens returned, as the provider reports that count for the call. If the provider does not report it, the field stays empty.

### Reasoning tokens

The count of reasoning tokens when the provider reports them as a distinct figure. When the provider does not report them, the field stays empty. It is not stored as zero, and input or output tokens are not relabeled to fill it.

### Cost by model, agent, task, and project

Money for a call, using the provider's reported price, then summed by model, by agent, by task, and by project. Each sum uses the same priced rows. A project total is the sum of its tasks. It is not a second pricing method.

### Latency

Elapsed time for the call, kept separate from queue time when both are known. Wall time from phase 1 remains available. Latency does not stand in for cost.

### Call count

How many model calls a task, an agent, or a project made. Retries count as calls. The count is not a quality metric.

### Retries

How many times a call or a check was repeated, and the reason recorded for each repeat. The same failure twice is visible here so module 10 can switch model on that rule. The ledger counts the retries. The cap that stops them lives in module 12.

### Tool use

Which tools a call used, and how many times. Tool use is an observability fact. It is not permission to widen what the tool may touch.

### Test and execution cost

Cost of running tests and other execution, recorded apart from model-call price. A cheap model bill beside an expensive suite stays visible as both numbers. F33's cost is the sum of those two parts for the same change.

### Maximum budgets

The ceiling for spend on a call, a task, and a project. Crossing a ceiling stops further spend. The ledger stores the ceiling and the amount used. Raising a ceiling is a critical operation and needs the human approval in module 12.

### Defects found per cost

Verified defects found, shown with the cost of the work that found them. The numerator is defects the gate caught, including defects the agent's own tests passed. The ratio is defects found per cost. Pass rate per cost is not the result. The pair stays visible. A favorable ratio does not clear a critical block, and a run that looks cheap because it chose easy checks is not an economic win.

## Observability

### Traces

One trace is one run: task, agent, model, checks, and the decision at the end. It points at the token row by operation id and does not recompute price. A critical block is its own result on the trace. The trace does not let the router or a score overwrite that result.

### Logs

Logs are the ordered events inside the trace: start, finish, retry, budget stop, and contract check. Decision history stays here: what was proposed, what ran, and what the deterministic result was. A model explanation may sit beside a finding. It is marked as explanation, and it does not edit the log or the result. Logs omit secret values.

### Metrics

Metrics are counts and durations rolled up from the log, kept as separate series: call count, latency, token counts, cost, retries, and budget remaining. A metric total can be recomputed from the events it cites. An explanation is absent from the metric inputs.

### Versions

Each record pins the contract revision, the model identifier, the agent identifier, and the checker revision. The contract revision on the trace matches the revision on the decision. A mismatch invalidates the run. A later version change does not rewrite the old row.

## Ponyfill and Capy

Ponyfill is unidentified. Capy is unidentified. This plan states that plainly and stops there.

This module does not invent an API, a vendor, or a capability for either name. It does not describe request shapes, authentication, limits, or return values for them.

In ordinary English, the word ponyfill means a compatibility implementation of a JavaScript feature. That meaning is not a token counter. This plan does not treat the word as a product that counts tokens.

Ask for the exact product names or links before any integration. Until those names or links are supplied, the ledger uses only the fields in this file, filled from providers that are already identified on the call.

### Tokens, cost, and training are different jobs

Counting tokens is one job: how large the call was. Cost is a second job: what that call, and the tests around it, cost in money. Training a model is a third job: changing a model from examples. This module covers the ledger and the observation of calls. It does not train a model, and a token count is not a price.

## Acceptance criteria

- [ ] A phase 1 call record contains model name and wall time, and leaves token counts, prices, and budgets empty.
- [ ] Input tokens, output tokens, and reasoning tokens are stored only when the provider reports them, and a missing reasoning-token field is not stored as zero.
- [ ] Cost can be totaled by model, by agent, by task, and by project from the same rows, and a task total equals the sum of its rows.
- [ ] A budget ceiling stops further spend, and a raise of that ceiling waits on human approval.
- [ ] Defects found per cost shows the defect count and the cost together. Pass rate per cost is not published as that result. An incomplete ledger stays incomplete.
- [ ] A finished run has one trace, an ordered log, separate metric series, and version pins. The trace does not overwrite a critical block.
- [ ] The file names Ponyfill and Capy only as unidentified, and it contains no API, vendor, or capability for them.

## Evidence

A reviewer can show a phase 1 row with model name and wall time only, a phase 2 row with the ledger fields the provider actually reported, an empty field where the provider was silent, a budget stop, and a trace joined to that row by operation id. A reviewer can also show that product claims about Ponyfill or Capy are absent.

## Later

Module 9 reads this ledger for Cost Efficiency once phase 2 rows exist. Module 10 reads time and cost as separate reward outcomes after its comparison gate passes. Training a model, if it is ever in scope, is a different plan and needs the exact job named first. Integration of Ponyfill or Capy waits on the exact product names or links.

## Related files

- `docs/plan/modules/09-scoring-engine.md` — Cost Efficiency, kept separate from other metrics.
- `docs/plan/modules/10-reinforcement-learning.md` — time and cost as reward terms, and the two-failure model switch.
- `docs/plan/modules/12-security-audit.md` — spend caps, secret-free logs, and approval to raise a budget.
- `docs/plan/features/F26-token-accounting.md` — provider-reported tokens and price.
- `docs/plan/features/F27-observability.md` — traces, logs, metrics, and version pins.
- `docs/plan/features/F33-economic-evaluation.md` — defects found per cost.
