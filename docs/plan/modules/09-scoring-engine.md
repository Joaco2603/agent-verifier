# Module 9 — Scoring engine

Phase 3 owns the adaptive score. Phase 1 already records pass and fail evidence for each check, and it records UNKNOWN and NOT_APPLICABLE when the gate does. UNKNOWN is not a pass. This module does not treat a blended score as something phase 1 computes or stores. Feature ids: F21, F33.

## Shared rules

- Each metric below stays on its own scale. A strong result stays on the metric that earned it.
- A critical failure is a block outside every score. A non-critical win does not cancel it.
- The router may change which model writes code. It leaves acceptance contracts unchanged.
- Module 7's attention score ranks how deep to verify. It is a different figure. It does not clear a block, and it is not this adaptive score.
- Module 8 may cite these metrics for one combination of agent, model, plan, and tests. Each part stays listed. A missing part stays missing.

## Phase boundary

### Phase 1 evidence

Store the check, the raw result, and the evidence for that result. Show those records directly. During phase 1 the metrics in this file are not computed, and no single health number is published for a task, an agent, or a project.

### Phase 3 adaptive score

Compute the metrics below from the history phase 1 started. Use the phase 2 cost ledger only when a metric needs cost. Show the metrics side by side. Adaptation means a later decision can prefer one history over another. It does not replace the rows with one number.

## Metrics

Each metric has one definition and one way it can lie.

### Defect Detection Score

**Definition.** Of the defects already known for the task, the share the run found. Confirmed defects the gate caught, including defects the agent's own tests passed, count as found.

**Failure mode.** The score rises when the known set is small, stale, or never seeded. Defects outside that set do not appear here. A high score means the known set was found.

### False Positive Rate

**Definition.** Of the findings the run reported, the share a later verified review marks as not defects. A false PASS later reversed by a reproduction counts on this side of the ledger.

**Failure mode.** The rate falls when the run reports less, including real defects. A low rate is not a substitute for Defect Detection Score. Both stay visible together.

### Contract Compliance

**Definition.** Of the acceptance checks on the task, the share the change still satisfies, judged against the approved contract revision, the frozen oracle for that run.

**Failure mode.** A check is rewritten so a miss becomes a pass. A diff under `contracts/` after approval invalidates the run, whether the author is the coding agent, the router, the teacher, or a scoring policy. An edit to a critical check is a block outside this score.

### Integration Score

**Definition.** Whether the change works on the integrated path the task names, judged only by checks that run the touched modules together.

**Failure mode.** Unit checks pass, the integrated path fails, and a unit-only tally is shown as integration. Isolated passes do not move this score.

### Evidence Score

**Definition.** Quality, independence, and reproducibility of the evidence behind a result. Quality means the evidence matches the claim. Independence means the authoring run is not the only witness. Reproducibility means another run can reach the same result from the recorded inputs.

**Failure mode.** The only witness is the agent that wrote the change, or the stored inputs do not reproduce the result. A second model's praise is not an input. A fluent write-up with no rerun does not raise this score.

### Task Estimation Score

**Definition.** How close module 1's PERT expected duration was to the time the task took, including fixes and retries. The estimate keeps optimistic, most likely, and pessimistic judgments.

**Failure mode.** Bounds so wide that every outcome looks accurate, or one hopeful number used in place of the three judgments. This score grades the estimate. It does not grade the code.

### Cost Efficiency

**Definition.** Verified results per cost, using F33's ratio: defects found per cost. Cost is model-call price plus test execution cost from the phase 2 ledger. The defect count and the cost stay listed beside any ratio.

**Failure mode.** A cheap run that skips hard checks looks efficient. Pass rate per cost is not this metric. An incomplete ledger leaves the metric incomplete. Phase 1 may log model name and wall time, and that log does not fill this score.

### Regression Score

**Definition.** Defects the change introduced, and defects the change brought back after they had been fixed.

**Failure mode.** The suite no longer contains the old failing cases, so a returning defect never moves the score. A pass on new checks is a different metric.

### Risk-Adjusted Score

**Definition.** A reading of the non-critical metrics that still leaves every critical failure as a block outside the figure. The block stays visible on its own. The figure may order non-critical work. It does not clear, offset, or dilute a critical failure.

**Failure mode.** A weight lets many small wins cancel one critical vulnerability. That cancellation is disallowed. If any critical check failed, the task stays blocked no matter how the other metrics look.

## Acceptance criteria

- [ ] Phase 1 output for a task is raw evidence only, with no blended score and no value filled in for the metrics in this file.
- [ ] Each metric can be computed, or marked waiting, without using another metric as a substitute.
- [ ] A case with one critical failure and strong non-critical results stays blocked, and Risk-Adjusted Score does not show that failure as cleared.
- [ ] Contract Compliance falls when an acceptance check is edited to fit the code, including an edit the router proposes.
- [ ] Cost Efficiency stays absent until the cost ledger exists, and it is defects found per cost, not pass rate per cost.
- [ ] Evidence Score falls when the only witness is the authoring agent, or when the recorded inputs do not reproduce the result.

## Evidence

A reviewer can open the phase 1 record and show that no score field was written. For phase 3, a reviewer can open one row per metric, the definition used, the failure mode that row is exposed to, and the critical block sitting outside those rows.

## Later

Choosing an agent or a model from these histories belongs to module 10, and only after the comparison gate there passes. Token counts and prices belong to module 11. Isolation, secrets, and approval of critical operations belong to module 12.

## Related files

- `docs/plan/modules/07-risk-decision.md` — attention score, separate from these metrics, and unable to clear a block.
- `docs/plan/modules/08-teacher-learning.md` — combination view that must keep each metric visible.
- `docs/plan/modules/10-reinforcement-learning.md` — selection reads these histories as separate outcomes.
- `docs/plan/modules/11-tokens-cost-observability.md` — cost ledger for Cost Efficiency and F33.
- `docs/plan/modules/12-security-audit.md` — critical blocks and contract protection.
- `docs/plan/features/F33-economic-evaluation.md` — defects found per cost.
