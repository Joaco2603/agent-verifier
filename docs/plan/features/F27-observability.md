# F27 — Observability

- Module: `docs/plan/modules/11-tokens-cost-observability.md`
- Phase: 2
- Objective: Record traces, logs, metrics, and versions.

## Plan

Phase 2 records how a run happened so a later reader can replay the claim. Phase 1 already attaches a contract revision and a raw result to a decision. This feature adds the path between those two points.

A trace is one run: task, agent, model, checks, and the decision at the end. Logs are the ordered events inside that trace. Metrics are counts and durations rolled up from those events, kept as separate series. Versions pin the contract revision, the model identifier, the agent identifier, and the revision of the checker that produced the result.

Each event names the agent that made an edit. Decision history stays in the log: what was proposed, what was run, and what the deterministic result was. An explanation written by a model may sit beside a finding. It is not a trace, and it must not edit the log, the metric, or the result.

Traces point at the token row in F26 by operation id. They do not recompute price. A critical security block is stored as its own result. The trace does not let the router or a score overwrite that result.

## Acceptance criteria

- A finished run has one trace, an ordered log, the metrics derived from that log, and the version pins listed above.
- The agent that made each edit is named on that edit's event.
- A metric total can be recomputed from the log events it cites.
- A model explanation stored on the trace is marked as explanation and is absent from the metric inputs.
- The contract revision on the trace matches the revision on the decision. A mismatch invalidates the run.

## Evidence

- The trace id, the log, and the metric series for one run.
- Version pins: contract revision, model, agent, checker.
- The operation id that joins the trace to an F26 row when a priced call exists.

## Depends on

- Phase 1 decisions that already store contract revision and raw result.
- Stable identifiers for agent, model, and checker revision.
- F26 operation ids for priced calls. A run with no priced call still gets a trace.

## Does not include

- Token counts, price, or budgets (F26).
- Training a model, or a reward update.
- Replacing a FAIL, UNKNOWN, or PASS with a narrative summary.
- Waiving a critical security block because the trace shows a low score or a different model.

## Related

- `docs/plan/modules/11-tokens-cost-observability.md`
- `docs/plan/modules/12-security-audit.md`
- F26, F19, F28, F32
- UC-13, UC-14, UC-21
