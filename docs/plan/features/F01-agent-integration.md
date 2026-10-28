# F01 — Integration with agents

- Module: `docs/plan/modules/03-code-generation.md`
- Phase: 1
- Objective: Connect Codex, Claude Code, Cursor, and other agents.

Phase 1 connects one configured agent. The boundary is the same for Codex, Claude Code, Cursor, and any other compatible agent: a configured command, a writable allow-list, a read-only contract, and a run report. One control plane covers that set.

## Plan

A human names the single agent in configuration before the run. The run record stores that name. The run does not switch agents mid-attempt. A missing configuration refuses to start.

The same inputs describe every agent in the set. The run sends the task instructions and the approved contract version. The contract file and its hash are mounted so the agent process can read the hash and cannot write the file. Module 2 is the source of that version. The report stores the hash the run was given.

Phase 1 runs one subtask at a time on that agent. The frozen-contract experiment in F03 withholds the YAML from the prompt and gives the agent the requirement sentence. This feature still records the approved hash and still rejects a write under `contracts/`.

Automatic model routing is F25 and stays in phase 3. This phase has no router.

## Acceptance criteria

- The report shows one configured agent name, and a fixture with no configured agent refuses to start.
- The same four inputs (command, allow-list, read-only contract, run report) describe Codex, Claude Code, Cursor, or another compatible agent.
- The agent process can read the approved hash, and a write to that contract file fails.
- The report stores the contract hash the run was given.
- The run keeps the same agent for the whole attempt.

## Evidence

The run report: agent name, contract hash, and the rejected write when a trial touches the contract. That report shows the boundary held. A passing test is not a proof of correctness. Another model's opinion is not ground truth.

## Depends on

- An approved contract version and hash from F03.
- The freeze in `docs/module-a/README.md`: the coding agent cannot edit approved contracts.

## Does not include

- Automatic model routing (F25), a mid-run model switch, or a second control plane.
- A second configured agent in Phase 1.
- Parallel subtasks.
- Allow-list enforcement, the retry cap, and the change log (F07).

## Related

- `docs/plan/modules/03-code-generation.md`
- F03, F07, F25, F29
- UC-05, UC-08
