# Module 3 — Code generation by agents

**Phase when it earns code:** 1, for one configured agent and an allow-list of files.

Model selection and parallel subtasks wait. Automatic routing is F25, phase 3. This phase 1 slice is the minimum agent boundary and the execution isolation that contracts and deterministic checks need. The product shape is a verifier that runs before commit.

**Feature ids:** F01, F07.

The agent may generate and repair code inside the allow-list. It does not decide correctness. Module 4 does. A passing test is not a proof of correctness. Another model's opinion is not ground truth. The agent must not edit an approved contract or a critical test to make itself pass. A critical security failure blocks the run.

## Integration with Codex, Claude Code, Cursor, and other compatible agents

The boundary is the same for Codex, Claude Code, Cursor, and any other compatible agent: a configured command, a writable allow-list, a read-only contract, and a run report. Phase 1 ships that boundary for one configured agent.

**Done when:** one configured agent can receive a task and write only inside its allow-list, and the same inputs are sufficient to describe Codex, Claude Code, Cursor, or another compatible agent without a second control plane.

## Selecting an agent for the task

A human names the single agent in configuration before the run. The run record stores that name. The run does not switch agents mid-attempt. Automatic routing is F25 and stays in phase 3.

**Done when:** the report shows the configured agent name, and a fixture with no configured agent refuses to start.

## Instructions and the frozen contract, read-only

The run sends the task instructions and the approved contract version. The contract file and its hash are mounted so the agent process cannot write them. Module 2 is the source of that version.

**Done when:** the agent process can read the approved hash, a write to that file fails, and the report stores the hash it was given.

## Independent subtasks

A human plan, and later module 1, may mark subtasks independent. Phase 1 still runs one subtask at a time, on the one configured agent, inside that subtask's allow-list. Parallel execution waits for a measured phase 1 result.

**Done when:** two subtasks marked independent produce two separate runs, the second starts only after the first finishes, and neither run sees the other's allow-list.

## File and scope control

The allow-list is the only writable scope. A write outside it is rejected and recorded. The agent cannot grow the list. Execution isolation means the agent process and the verification process do not share a writable workspace.

**Done when:** a write inside the list is kept, a write outside the list is rejected, the rejection is in the report, and verification reads a copy the agent cannot modify.

## Change and version log

Every kept write records the path, the hash before, the hash after, the agent name, and the attempt number. A changed path with no log entry is a block.

**Done when:** a one-file edit has one log entry with those five fields, and a file that changed with no entry blocks the run.

## Limited retries and repair

The retry cap is fixed before the run. The fixture cap is 2. Each retry and each repair is a new attempt under the same frozen contract and the same allow-list. Attempt 3 does not start. A repair is not a pass.

**Done when:** a failing fixture stops after two attempts, both attempts share the original contract hash and allow-list, and the report status is failed.

## Model, tokens, time, and cost

Each attempt emits one event: model id, input tokens, output tokens, wall time, and cost. An unknown field is stored as `unknown`. The event is never omitted. Module 11 (phase 2) owns the ledger and will ingest these events. This module must not drop them while that ledger is still absent.

**Done when:** a finished attempt, including a failed one, has that event in the run report, and a missing cost is `unknown` rather than a missing event.

## Unauthorized edits to contracts and critical tests

A diff that touches an approved contract or a critical test is a block, including edits made inside an allow-list by mistake. The attempt stays in the log. The approved bytes and the critical tests stay at their approved hashes. Verification uses those hashes.

**Done when:** a fixture that modifies either kind of file is blocked, both hashes match the approved versions, and the run is not accepted.

## Acceptance criteria (checkable)

- [ ] Phase 1 runs one human-configured agent. Automatic routing (F25) has no code.
- [ ] The same boundary describes Codex, Claude Code, Cursor, and another compatible agent.
- [ ] Instructions and the frozen contract are delivered read-only, with the approved hash.
- [ ] Independent subtasks run one at a time. Parallel runs have no code in this phase.
- [ ] Writes outside the allow-list are rejected, and verification uses a workspace the agent cannot modify.
- [ ] The change log has path, before hash, after hash, agent, and attempt, or the run blocks.
- [ ] Retries and repairs stop at the configured cap and keep the same contract and allow-list.
- [ ] Every attempt emits model, tokens, time, and cost without dropping the event.
- [ ] Edits to approved contracts or critical tests block the run and leave those files unchanged.

## Evidence

The run report: agent name, contract hash, allow-list, change log, attempt count, block reason, and the cost event. The diff shows what changed. Module 4's report shows whether checks passed. Neither report is a proof of correctness.

## Later

Phase 2 adds module 1's plans and module 11's ledger on top of these events. Phase 3 adds the teacher, the adaptive score, reinforcement learning, and the model router (F25). Parallel subtasks wait for a measured phase 1 result. Genetic search over agent choice waits until it beats the configured single agent on the same benchmark.

## Related files

- [docs/plan/modules/02-requirements-contracts.md](02-requirements-contracts.md)
- [docs/plan/modules/04-deterministic-verification.md](04-deterministic-verification.md)
- [docs/plan/modules/01-task-planning.md](01-task-planning.md)
- [docs/module-a/README.md](../../module-a/README.md)
