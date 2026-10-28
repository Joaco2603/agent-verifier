# F19 — Evidence reports

- Module path: `docs/plan/modules/07-risk-decision.md`
- Phase: 1
- Objective: Show reproducible results, references, and limitations.

The report shows the stored result. A model may explain the report and must not change the stored result.

## Plan

Bind the report to the F18 rollup, each check state, and the findings a second run can reproduce. Each finding has a check id, a file and line or a reproduction command, and the observed result. A finding with neither a location nor a reproduction command is absent. A paragraph that only explains the change is not a finding.

References are copied from the stored result: file and line, contract id, or the command and fixture hashes. The report does not add a citation the result lacks.

Limitations are their own section: unparsed files, unseen dynamic calls, empty defect history, and, when Phase 2 has computed R, the fact that the weights are not a measured model. An empty limitation section is valid only when the result record lists nothing in those categories.

The reproduction block carries the command or fixture, the revision, and the contract revision. A second run that follows it reaches the same observed result for a deterministic check. The explanation is a separate field. Saving it leaves the rollup, the check states, the findings, the references, and the limitations unchanged.

## Acceptance criteria

- The report's rollup and check states equal the F18 rows for that result.
- A finding without a file and line or a reproduction command does not appear.
- A missing check stays UNKNOWN in the bound result and is named in limitations when the result says it was not run.
- An explanation that claims PASS leaves a stored FAIL as FAIL.
- A citation that is not in the stored result is rejected.

## Evidence

Regenerate the report from the stored result and diff the bound fields. Then replay one finding. The diff and the replay are the evidence. An LLM explanation cannot replace the stored result or the test replay.

- Diff the passing fixture's rollup, command, revision, and references against the stored result.
- Replay that command. Archive the observed result.
- Build the report for an unparsed file. Archive the limitation and the UNKNOWN state.
- Submit an explanation that says the check passed. Archive the unchanged FAIL.

## Depends on

- F18 states, rollups, and pointers to raw results.
- Run artifacts that already contain the command, the revision, and the location, from `docs/plan/modules/07-risk-decision.md`.

## Does not include

- Changing a state, a weight, or a limitation from the explanation.
- Computing R (F17) or a quality metric (F21).
- Teacher proposals (F20). The teacher may read the report and may not edit this result.
- Treating the explanation paragraph as a finding.

## Related

- `docs/plan/modules/07-risk-decision.md`
- F17, F18, F20, F21
- UC-13, UC-14, UC-16
