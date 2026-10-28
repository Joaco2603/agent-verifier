# Module 8 — Teacher, learning, and continuous evaluation

Phase 3. Start only after Phase 1 and Phase 2 have a stored history of reproducible results. Feature ids: F20, F21, F22, F23.

"Gentleman profesor" means this teacher. It is not a separate product. The teacher evaluates results and recommends a next strategy. A learning label is written only from a reproducible result. Another model's opinion is not ground truth.

## Shared rules

- The teacher proposes. A FAIL stays FAIL until the same check passes on a new revision.
- The teacher and any scoring policy read approved contracts and must not edit them.
- Memory, scores, and selections cite a stored result. A recommendation with no result is not a label.

## Teacher evaluates results and helps find strategy errors

The teacher reads states, reproductions, and divergences that already exist. It may point at a strategy error: a missing scenario, a weak oracle, a model that found fewer defects on the same tasks, or a plan that skipped a critical rule. The note cites the result ids it used. It writes no state and no contract.

## Quality score for a combination of agent, model, plan, and tests

Score the combination of agent, model, plan, and tests from stored outcomes: confirmed defects found, false PASS rows later reversed by a reproduction, and recorded duration. Each part of the score cites those rows. A second model's praise or blame is not an input. With no rows for that combination, the score is absent, not a default.

## Experience memory of tasks, decisions, defects, and fixes

Store task id, the decision taken, defect id, fix revision, and a pointer to the evidence. A decision is the depth, the checks, or the model actually used. A fix counts when the minimized reproduction from Module 6 passes on that revision, or when the Phase 1 check that failed now passes. An opinion about the task is not a memory row.

## Feedback loop that uses verified results only

The loop's inputs are verified results: a deterministic check with a stored outcome, or a failure with a reproduction that fails the same check on a second run. Teacher text, explanations, and another model's review do not enter the loop as results. The loop may change a recommendation. It may not change a past state.

## Strategy evaluation

On one shared task set, compare models and methods by confirmed defects found per hour and by false PASS rows later reversed. Publish the counts with the task ids. The leading method does not rewrite earlier FAIL or PASS rows. A method with no reproduced finds on that set shows a zero, and the zero stays.

## Test recommendation by expected value

Recommend a test when its expected value is higher than the alternatives on the same history. Expected value uses confirmed defects that kind of test has found and the recorded time that kind of test has cost. The output is a proposal with the rows it used. Accepting the proposal means scheduling the test, which then has to produce its own result.

## Adaptive model selection from the measured history

Choose a model for a future task from the strategy table. Record the table rows that justified the choice. The choice applies to the next run. It does not change the score or the state of a finished task. With an empty table, selection stays on the current default and says the history is empty.

## Learning PERT estimates from real durations

Update optimistic, most likely, and pessimistic duration from the recorded durations of finished tasks of that class. A recommended estimate is stored as a proposal until a finished task writes its actual duration. Missing durations are omitted. They are not guessed to fill the estimate.

## Learning risk patterns associated with defects

Learn a pattern only when a change feature and a later confirmed defect co-occur in stored rows. The pattern may be offered as an input when Module 7 next computes defect history. It does not change H by itself, does not change a state, and does not edit a contract. A pattern suggested by a model, with no defect id, is discarded.

## Independent review

The coding agent that produced the change is not the only authority on that change. A separate review path records its own conclusion from the same evidence ids. The path may be this teacher or a different checker. Its conclusion is a recommendation unless it is backed by a check the evidence store already holds. The author's own summary cannot be the rollup state.

## Limit

The teacher proposes. It does not relabel a failure as a pass. PASS is written by the Phase 1 check or by the reproduced scenario on the revision under test. A teacher sentence that calls the failure acceptable leaves the stored FAIL in place.

## Acceptance criteria

- [ ] No quality score, selection, PERT update, or risk pattern is written before the evidence store has a reproducible result for that task class. An empty class stays empty.
- [ ] A teacher note cites result ids and leaves check states and approved contracts unchanged.
- [ ] The quality score is attached to a specific agent, model, plan, and test combination, and each component cites stored outcomes. A second model's opinion is absent from the inputs.
- [ ] Memory rows contain task, decision, defect, and fix only when those point at evidence. A fix row exists only after the previously failing check passes on the fix revision.
- [ ] The feedback loop rejects an input that is explanation text without a stored check or reproduction.
- [ ] Strategy evaluation reports confirmed defects for at least two methods on the same tasks, including a zero when a method found none.
- [ ] A test recommendation shows expected value from historical yield and cost, and scheduling it does not by itself mark any check PASS.
- [ ] Model selection and PERT updates cite measured rows. They do not alter finished states.
- [ ] A risk pattern without a confirmed defect id is discarded and does not change H.
- [ ] The rollup state is computable when the coding agent's own summary is removed.
- [ ] F20, F21, F22, and F23 close only on these checks. The teacher cannot close them by agreeing with the coding agent.

## Evidence

Evidence is the prior reproducible check, reproduction, divergence, duration, and defect row this module cites. New labels are valid when they point at those rows and a second computation on the same rows produces the same score or the same counts. Teacher prose is a proposal. It is not evidence and it is not a state.

## Later

Reinforcement learning that picks a strategy belongs after this loop, and its reward is a verified result from Phase 1 or Phase 2. Genetic search stays under the Module 6 hourly comparison. Fitting new risk weights stays in Module 7 and still requires archived uncalibrated weights. This module does not start that fit on its own.

## Related files

- `docs/plan/modules/05-ast-code-to-spec.md` — divergences the teacher may explain and must not edit.
- `docs/plan/modules/06-integration-search.md` — reproductions that decide whether a fix is real.
- `docs/plan/modules/07-risk-decision.md` — states, depth, and H, which this module may inform and must not overwrite.
