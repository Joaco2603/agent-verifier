# Verification platform — plan

This folder is the plan for a gate in front of coding agents. The agent may write the code. It does not decide that the code is correct.

The diagram is [`architecture.drawio`](architecture.drawio). Open it in [diagrams.net](https://app.diagrams.net/) with **File → Open From → Device**. It is a logical plan, not a system that has been deployed or measured.

The contract format is already decided in [`../module-a/README.md`](../module-a/README.md): YAML, a JSON Schema envelope, closed fields, and structural checks. This plan does not reopen that choice.

Ponyfill and Capy are unidentified. Nothing in this plan integrates them. The ordinary word ponyfill means a JavaScript compatibility implementation, not a token counter. Tokens, cost, and model training are three different jobs.

## Five priorities

1. **Independent contracts.** The agent cannot change what “correct” means.
2. **Evidence.** A decision cites a reproducible result. Another model’s opinion is not that result.
3. **PERT and decomposition.** Split work that is too long, too uncertain, or too critical to check in one step, then check each part.
4. **Teacher, score, and learning.** Use verified history to choose models, tests, and strategies. The teacher cannot relabel a failure.
5. **A real benchmark.** Show extra defects caught against the agent’s own tests, at a recorded cost.

## Build order

Do not build all 34 features at once.

| Phase | Build | Stop until |
| --- | --- | --- |
| 1 | Contracts, deterministic checks, evidence report, CI block, execution isolation, one configured agent, the benchmark | The Module A rule: at least 10 catches the agent’s tests missed, at most 2 false accepts, at most 3 weak contracts, median approval at or under 25 minutes |
| 2 | AST and code-to-spec, PERT and the dependency split, risk score, integration search except genetic algorithms, token ledger | Phase 1 has escape rate, false alarms, cost, and requirement coverage |
| 3 | Teacher, separate quality metrics, experience memory, model router, rules-vs-bandit-or-RL, genetic search only if it beats simpler search | A fixed rule strategy has a recorded history to beat |

A critical security failure blocks in every phase. A high score does not cancel it. `UNKNOWN` is not a pass.

## Modules

| | Plan | First phase |
| --- | --- | --- |
| 1 | [Task planning](modules/01-task-planning.md) | 2 |
| 2 | [Requirements and contracts](modules/02-requirements-contracts.md) | 1 |
| 3 | [Code generation](modules/03-code-generation.md) | 1, one agent |
| 4 | [Deterministic verification](modules/04-deterministic-verification.md) | 1 |
| 5 | [AST and code-to-spec](modules/05-ast-code-to-spec.md) | 2 |
| 6 | [Integration search](modules/06-integration-search.md) | 2 |
| 7 | [Risk and decision](modules/07-risk-decision.md) | 1 for states, 2 for the score |
| 8 | [Teacher and learning](modules/08-teacher-learning.md) | 3 |
| 9 | [Scoring engine](modules/09-scoring-engine.md) | 3 |
| 10 | [Reinforcement learning](modules/10-reinforcement-learning.md) | 3 |
| 11 | [Tokens, cost, observability](modules/11-tokens-cost-observability.md) | 2 |
| 12 | [Security, audit, trust](modules/12-security-audit.md) | 1 |

## Features

| ID | Plan | Objective |
| --- | --- | --- |
| F01 | [Agent integration](features/F01-agent-integration.md) | Connect Codex, Claude Code, Cursor, and other agents. |
| F02 | [Requirement interpretation](features/F02-requirement-interpretation.md) | Detect ambiguity, contradictions, and incomplete requirements. |
| F03 | [Verifiable contracts](features/F03-verifiable-contracts.md) | Acceptance criteria that do not depend on the generated code. |
| F04 | [PERT](features/F04-pert-planning.md) | Estimate duration, uncertainty, and effort. |
| F05 | [Task decomposition](features/F05-task-decomposition.md) | Split complex work into checkable subtasks. |
| F06 | [Dependency graph](features/F06-dependency-graph.md) | Order tasks and identify the critical path. |
| F07 | [Code generation](features/F07-code-generation.md) | Run agents inside defined limits. |
| F08 | [Deterministic tests](features/F08-deterministic-tests.md) | Run unit, integration, and regression tests. |
| F09 | [Property verification](features/F09-property-verification.md) | Check invariants and general behavior. |
| F10 | [Security](features/F10-security.md) | Detect vulnerabilities and authorization failures. |
| F11 | [AST analysis](features/F11-ast-analysis.md) | Extract structure and potential behavior from the code. |
| F12 | [Flow analysis](features/F12-flow-analysis.md) | Study dependencies, data, and execution paths. |
| F13 | [Code-to-spec](features/F13-code-to-spec.md) | Compare code behavior with requirements and documentation. |
| F14 | [Advanced integration](features/F14-advanced-integration.md) | Find errors between services and components. |
| F15 | [Scenario search](features/F15-scenario-search.md) | Explore edge cases and problematic sequences. |
| F16 | [Genetic algorithms](features/F16-genetic-algorithms.md) | Explore combinations only if they beat simpler search. |
| F17 | [Risk evaluation](features/F17-risk-evaluation.md) | Decide how deep verification must go. |
| F18 | [Decision engine](features/F18-decision-engine.md) | Classify PASS, FAIL, UNKNOWN, or NOT_APPLICABLE. |
| F19 | [Evidence reports](features/F19-evidence-reports.md) | Show reproducible results, references, and limitations. |
| F20 | [Teacher](features/F20-teacher.md) | Evaluate results and propose improvements. |
| F21 | [Quality score](features/F21-quality-score.md) | Measure effectiveness, precision, cost, and evidence quality. |
| F22 | [Experience memory](features/F22-experience-memory.md) | Record decisions, errors, fixes, and history. |
| F23 | [Adaptive learning](features/F23-adaptive-learning.md) | Improve test, strategy, and estimate selection. |
| F24 | [Reinforcement learning](features/F24-reinforcement-learning.md) | Optimize decisions from verified rewards. |
| F25 | [Model router](features/F25-model-router.md) | Choose models by performance, cost, and task type. |
| F26 | [Token accounting](features/F26-token-accounting.md) | Measure consumption, latency, and cost. |
| F27 | [Observability](features/F27-observability.md) | Record traces, logs, metrics, and versions. |
| F28 | [Execution safety](features/F28-execution-safety.md) | Isolate code and limit permissions. |
| F29 | [Contract protection](features/F29-contract-protection.md) | Stop the agent from changing its own acceptance criteria. |
| F30 | [Benchmark](features/F30-experimental-benchmark.md) | Measure gains against existing tools and tests. |
| F31 | [Regression detection](features/F31-regression-detection.md) | Stop a fix from introducing other defects. |
| F32 | [CI/CD](features/F32-cicd-integration.md) | Block changes that break critical conditions. |
| F33 | [Economic evaluation](features/F33-economic-evaluation.md) | Measure whether the gains justify the cost. |
| F34 | [Commercial validation](features/F34-commercial-validation.md) | Determine who would pay, and why. |

## What this folder is not

No runner, no model training, and no hosted service. The benchmark numbers are a gate for later work. They have not been collected.
