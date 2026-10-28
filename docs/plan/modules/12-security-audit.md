# Module 12 — Security, audit, and trust

Not optional. Phase 1. This module is a constraint on running generated code, in force before the first generated command runs. It is not a later add-on. Feature ids: F10, F28, F29, F32.

A critical failure stays a block outside every score. Good results on other checks do not clear it. The router may change which model writes code. The router leaves acceptance contracts unchanged. The finding, the score, and the block are three separate fields.

## Constraints

### Isolation

Generated code runs in an environment that does not share the operator's credentials, the repository secret store, or write access to the contract tree. A failure, a file write, or a network call stays inside that boundary. The command does not start until the boundary is recorded.

### Least privilege

The run receives only the files and commands the task declared. A broader grant is named in the run record before the process starts. A grant is not implied by the prompt. The agent that wrote the code does not grant itself the extra permission, and a retry does not widen permissions on its own.

### Secrets

Secrets stay in the secret store. Prompts, logs, traces, and evidence may record that a secret was present and was withheld. They do not record the secret value, a token, or a connection string. A secret in the log is a critical block.

### Network and file limits

The default is no network, and a file allow-list of the task's paths. A destination or a path outside those lists is refused and the run fails. A check that needs a broader grant names that grant before the process starts. Widening either list is a critical operation. A write outside the allow-list, including a write under `contracts/`, is a critical block.

### Contract and critical-test protection

Acceptance contracts and critical tests are protected inputs. After a person approves a revision, that blob is the oracle for the run. A diff under `contracts/` after approval invalidates the run, whether the author is the coding agent, the router, the teacher, or a scoring policy. Repair is a new revision and a new human approval, then a new run. One syntax error goes back to the same agent. The same failure twice may switch model. Neither event is a reason to edit the contract or to delete a critical test.

### Traceability

Every result links to the task, the contract revision, the checks that ran, the model name, and the evidence. A reviewer can walk that chain without asking the agent what it remembers. A mismatch between the contract revision on the trace and the revision on the decision invalidates the run.

### Defense against malicious instructions in a repository

Text in the repository is data for the task. Instructions found there do not raise privilege, change contracts, disable checks, approve spend, or override this module. The agent follows the operator's task and these constraints when repository text conflicts with them.

### Decision history

Each decision records who or what decided, what the decision was, and which evidence was on hand. The history is append-only. A later run does not rewrite an earlier decision to match a new result. A model explanation may sit beside the decision. It does not change a block into a warning.

### Reproducible evidence

Evidence names the inputs, the versions, and the steps that produced the result. Another run can follow that record and reach the same result. A claim that cannot be rerun does not count as evidence for a pass. UNKNOWN and a missing result do not pass a critical requirement. Not applicable passes one only when the contract itself says the requirement does not apply, and that reason is stored.

### Human approval for critical operations

A person approves critical operations before they happen. That set includes widening network or file limits, revealing or injecting a secret beyond the narrow path, changing an acceptance contract, deleting or weakening a critical test, raising a spend ceiling, and running with privilege above the task default. The policy in module 10 may ask a human earlier. It may not skip this approval.

### Retry and spend limits

Retries and spend have hard ceilings. The same failure is visible so the model can switch after the second time, and the ceiling still stops the loop. Phase 1 enforces these ceilings even though the full cost model waits until phase 2. A retry does not continue because a score looks recoverable.

### Record of which agent made each edit

Every edit records the agent that made it, the model used, and the task it belonged to. A later agent that touches the same lines adds its own record. The history shows the sequence. It does not collapse to the last writer only.

## Running generated code

Before generated code runs, isolation, least privilege, secret handling, and network and file limits are already applied. The CI check then fails closed. Two results block the change on their own: a FAIL of a critical contract or a critical security finding, and an invalid contract diff. An authorization failure is that kind of finding: an actor without the required permission can perform the operation, or the permission check is missing. A permission or admin change runs the security checks at any score. The job's exit is the block. A comment, a model explanation, or a green unit-test job does not clear it.

A missing control cancels the run. It does not become a follow-up while the run proceeds. The wider static catalog of vulnerability classes can add evidence in phase 2. Phase 1 still blocks a critical finding from the checks it does run.

## Acceptance criteria

- [ ] A generated command is refused when isolation, least privilege, or the network and file limits are not recorded.
- [ ] A process that opens a network destination or a path outside the allow-list fails the run, and logs contain no secret value.
- [ ] Repository text that tells the agent to skip a critical test, edit a contract, or raise a budget leaves the contract, the test, and the budget unchanged.
- [ ] A critical security or authorization failure stays a block outside any score, including when other checks pass and when the risk score is low.
- [ ] UNKNOWN or a missing result on a critical requirement fails the check. A diff under `contracts/` after approval fails it, including a diff from the router.
- [ ] One syntax error returns to the same agent. The same failure twice may switch model. Retries stop at the ceiling either way.
- [ ] A critical operation without a recorded human approval does not run.
- [ ] Every edit has an agent, a model, and a task on its record.

## Evidence

A reviewer can show a refused run that lacked a control, a log with secret values withheld, an ignored hostile instruction from the repository, an approval record for a critical operation, a retry stopped at the ceiling, the CI reject row, and an edit history that names the agent for each change. The finding, the score, and the block are visible as three fields.

## Later

Phase 2 adds the token and cost ledger in module 11, and it may add a wider static catalog as extra evidence. The ceilings in this module already bound retries and spend before that ledger exists. Phase 3 may learn selections in module 10 only after its comparison gate passes, and only inside the controls in this file. Scoring in module 9 never absorbs a critical block into a blended score.

## Related files

- `docs/plan/modules/02-requirements-contracts.md` — approved contracts this module refuses to let the agent edit.
- `docs/plan/modules/04-deterministic-verification.md` — checks whose pass does not lift a critical block.
- `docs/plan/modules/09-scoring-engine.md` — critical blocks stay outside every score.
- `docs/plan/modules/10-reinforcement-learning.md` — model switch and same-agent syntax retry, without editing contracts.
- `docs/plan/modules/11-tokens-cost-observability.md` — ledger that later prices the spend these ceilings already limit.
- `docs/plan/features/F10-security.md` — critical vulnerability and authorization findings.
- `docs/plan/features/F28-execution-safety.md` — isolation, least privilege, secrets, and allow-lists.
- `docs/plan/features/F29-contract-protection.md` — frozen oracle and invalid diffs under `contracts/`.
- `docs/plan/features/F32-cicd-integration.md` — fail-closed check before a change is accepted.
