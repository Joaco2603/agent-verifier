# F15 — Scenario search

- Module path: `docs/plan/modules/06-integration-search.md`
- Phase: 2
- Objective: Explore edge cases and problematic sequences.

Search uses coverage-guided fuzzing and fault combinations. Genetic search is F16. The search proposes candidates. The reproduced check decides the outcome. This feature does not run a genetic search, and a search score is not a correctness oracle.

## Plan

Fault injection names the fault, the injection point (file and line, or an external boundary), and the contract result that should follow. The run stores the observed result beside that expected result. A fault that was planned and not injected stays unresolved.

Problematic sequences are stored schedules and the three delivery cases. At least two schedules are recorded when a contract shares state across steps. A pass on one schedule stands only for that schedule. An unrecorded interleaving is neither a pass nor a fail. Retry, timeout, and duplicate delivery each have their own scenario. A retry log includes attempts that failed before a later success. A timeout stores the deadline and the result after the deadline. A duplicate stores the second delivery and the contract's expected result.

Coverage-guided fuzzing starts from contract inputs and from minimized failures. An input is kept when coverage grows or a contract check fails. Store the input, the coverage delta, and the check. A crash outside an asserted contract check stays a recorded crash, and the contract result stays unresolved.

Shrink the input, the schedule, and the faults while the same check still fails. Store the smaller case beside the original. Both must fail that same check. Every confirmed failure stores one command or fixture that fails that check on a second run.

## Acceptance criteria

- A fault that was not injected stays unresolved, with the injection point recorded.
- Two schedules can pass and fail independently. A missing schedule is neither outcome.
- Retry, timeout, and duplicate each have a scenario, and the retry log includes the failed attempts.
- A fuzz input that fails a contract check is stored with the input, the coverage delta, and the check. The minimized case fails that same check.
- The artifact has no genetic population, crossover, or mutation step.

## Evidence

Replay the command or fixture. The runtime result, the fault or schedule that was actually applied, and the coverage delta are the evidence. A prose summary is not a reproduction. An LLM explanation cannot replace the replay.

- Re-run the minimized failure. The same check fails. Archive both results.
- Run the single-fault and paired-fault fixtures. Archive which combinations were injected and which stayed unresolved.
- Re-run the recorded fuzzer seed. Archive the input, the coverage delta, and the failing check.
- Confirm the Phase 2 artifact contains no genetic search step.

## Depends on

- F14 for composed runs and for expected results copied from the approved contract.
- A coverage signal from that run, and the fault list in `docs/plan/modules/06-integration-search.md`.

## Does not include

- Genetic and evolutionary search, and the failures-per-hour comparison that decides whether to keep it (F16).
- Using a coverage delta or a fuzzer score as a verdict (F18).
- Closing a defect with a different test than the minimized case.
- The Phase 1 regression sweep across frozen contracts (F31).

## Related

- `docs/plan/modules/06-integration-search.md`
- F14, F16, F17, F18
- UC-22, UC-36
