# F21 — Quality score

- Module path: `docs/plan/modules/09-scoring-engine.md`
- Phase: 3
- Objective: Measure effectiveness, precision, cost, and evidence quality.

The four metrics stay on their own scales. There is no single blended score that hides a critical hole. A critical failure stays a block beside them. The attention score in Module 7 is a different figure and is not this score.

## Plan

Effectiveness is the share of defects already known for the task that this run found, including defects the agent's own tests passed. The known-set size is stored beside the share. A high share on a small known set stays visible as that denominator.

Precision is the share of reported findings that a later verified review still marks as defects. The reported count and the rejected count are stored beside the share. If nothing was reported, precision is absent, not a perfect score. A false PASS later reversed by a reproduction counts against precision. Effectiveness stays listed beside precision so a quieter report cannot hide a miss.

Cost is defects found per cost. Cost is model-call price plus test execution cost from the cost ledger. The defect count and the cost are stored beside the ratio. Pass rate per cost is not the metric. An incomplete ledger leaves cost incomplete.

Evidence quality is whether the evidence matches the claim, whether the authoring run is not the only witness, and whether another run reaches the same result from the recorded inputs. A fluent explanation does not raise it. A second model's praise is not an input.

Phase 1 stores raw check results and does not compute these four. A payload with one rolled-up number in place of the four is rejected. A task with a critical failure stays blocked no matter how the four look.

## Acceptance criteria

- A known set of 4 defects with 2 found stores effectiveness 2/4 and the denominator 4.
- Five reports, one later rejected, store precision 4/5 with both counts. Zero reports store precision as absent.
- Cost stays absent until the ledger exists, and the stored ratio lists defects and cost separately.
- An explanation-only claim, or a claim whose inputs do not replay, lowers evidence quality.
- One critical failure with strong metrics stays blocked, and no blended number is written.

## Evidence

Recompute each metric from the archived counts. One row per metric is the evidence, with the counts it used. An LLM explanation cannot replace those counts or a replay.

- Replay the seeded defects. Diff effectiveness against the golden share and denominator.
- Replay the verified-review fixture. Diff precision and the rejected count.
- Run the missing-ledger fixture. Archive absent cost.
- Run the author-only witness fixture. Archive the evidence-quality row and the unchanged critical block.

## Depends on

- F18 states and F19 reproductions for the counts.
- The cost ledger for the cost metric, and the metric rules in `docs/plan/modules/09-scoring-engine.md`.

## Does not include

- One health number, weighted average, or blend of the four.
- Using R as this score, or letting R clear a critical block.
- Filling Phase 1 tasks with these metrics.
- Letting contract, integration, estimation, or regression results cancel a weak metric. Those stay separate.

## Related

- `docs/plan/modules/09-scoring-engine.md`
- F17, F18, F19, F33
- UC-60, UC-61
