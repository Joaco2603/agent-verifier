# Module 6 — Integration verification and fault search

Phase 2 covers scenarios, fault injection, concurrency simulation, retries, timeouts, duplicates, coverage-guided fuzzing, automatic reproduction, case minimization, and regression after a fix. Genetic and evolutionary search is Phase 3, and only after the comparison in that section. Feature ids: F14, F15, F16, F31.

A failing integration scenario counts when a runtime result reproduces it. The search that proposed the scenario does not decide correctness. AST facts from Module 5 may suggest where to look. They do not replace the run.

## Shared rules

- A runtime result is evidence. An LLM account of what probably happened is not a result.
- Expected behavior comes from the approved contract's precondition, effect, and failure. Wording overlap with the contract is not a pass.
- Names of helpers and tests are labels. The assertion that ran is the check.
- This module reads approved contracts and does not edit them.

## Scenarios

An integration scenario has an id, a contract id, preconditions, ordered steps, and an expected result copied from that contract. The scenario runs against the composed components the contract names. A written story with no steps and no expected result is not a scenario. The stored outcome is the observed result plus whether it matched the contract field by field.

## Fault injection

Each injected fault names the fault, the injection point (file and line, or an external boundary), and the contract result that should follow. The run stores the observed result beside that expected result. A fault that was planned and not actually injected is a skipped run, which leaves the check unresolved.

## Concurrency simulation

Simulate at least two recorded schedules for a contract that shares state across steps. Each schedule stores the order of steps and the observed result. A pass on one schedule stands only for that schedule. An unrecorded interleaving is not a pass and not a fail.

## Retries, timeouts, and duplicates

Keep retry, timeout, and duplicate delivery as three scenarios. The contract supplies the expected result of each. A retry records every attempt, including attempts that failed before a later attempt succeeded. A timeout records the deadline and the result once the deadline is crossed. A duplicate records the second delivery and the contract's expected idempotent or conflicting result.

## Coverage-guided fuzzing

Fuzz from seeds taken from contract inputs and from minimized failures. Keep an input when it grows coverage, and keep it when it fails a contract check. Store the input, the coverage delta, and the check that failed. Fuzzing finds candidates. The reproduced check decides the outcome. An input that only crashes outside an asserted contract check stays a recorded crash, with the contract result marked unresolved.

## Automatic reproduction

Every confirmed failure stores the input, the schedule, the injected fault if any, the revision, and one command or fixture that runs that same failure again. A second run of that command or fixture must reach the same failing check. A prose summary of the bug is not a reproduction.

## Case minimization

Shrink the input, the schedule, and the injected faults while the same check still fails. Store the smaller case next to the original. Both must fail that same check. A smaller case that fails a different check is a new case, and the original stays open.

## Regression after a fix

After a fix, run the minimized reproduction on the new revision. The defect stays open until that same case passes the same check. A different test that passes does not close it. Store the new result with the revision. If the reproduction no longer runs, the defect stays open and the report says the reproduction broke.

## Genetic and evolutionary search

This search is Phase 3. It looks for failing integration scenarios. It does not mark a scenario correct or incorrect. Build it only when measured confirmed failures per hour are higher than coverage-guided fuzzing, higher than property-based tests, and higher than random scenarios, on the same integration surface and with the same accounting hour. A tie, or a loss to any of those three, means the search stays out. Until that measurement exists, the build contains the Phase 2 methods only. Any later search output is a candidate scenario and still needs the reproduction path above.

## Acceptance criteria

- [ ] A scenario without a contract id, steps, and a structured expected result cannot be stored as an integration scenario.
- [ ] A fault-injection run stores fault name, injection point, expected contract result, and observed result. A fault that was not injected stays unresolved.
- [ ] Two stored schedules can pass and fail independently. A missing schedule is neither PASS nor FAIL.
- [ ] Retry, timeout, and duplicate each have their own scenario, and a retry log includes failed attempts that preceded a success.
- [ ] A fuzz input that fails a contract check is stored with the input and the check. The fuzzer's score is not the decision.
- [ ] Each confirmed failure has a command or fixture that fails the same check on a second run.
- [ ] The minimized case fails the same check as the original. A fix closes the defect only when that minimized case passes on the new revision.
- [ ] Genetic and evolutionary search is absent from the Phase 2 build. It is added only after the hourly comparison above shows more confirmed failures than each of the three baselines, and its hits still pass through reproduction.
- [ ] F14, F15, F16, and F31 close only through these checks. An unreproduced candidate closes none of them.

## Evidence

Evidence is the scenario record, the observed runtime result, the schedule or fault that was actually applied, and the reproduction command or fixture. Coverage numbers and search scores are diagnostic. They become evidence only together with a reproduced check. Explanations of a failure are not evidence.

## Later

Property-based tests and random scenarios are the baselines in the Phase 3 comparison. They are required before genetic search can be kept. Reinforcement learning that would choose a search strategy waits until Module 8 has labels taken from reproduced results. Search parameters are not part of this plan.

## Related files

- `docs/plan/modules/05-ast-code-to-spec.md` — structured behavior that can suggest scenario targets.
- `docs/plan/modules/07-risk-decision.md` — states for reproduced failures, and depth that includes these runs.
- `docs/plan/modules/08-teacher-learning.md` — recommendations that must not relabel a reproduced failure.
