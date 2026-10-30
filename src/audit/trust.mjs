export function applyRepoText(state, text) {
  return {
    repoText: text,
    contractHash: state.contractHash,
    criticalTests: state.criticalTests,
    budget: state.budget,
    checks: state.checks,
  };
}

const CRITICAL = new Set([
  "widen-network",
  "widen-files",
  "reveal-secret",
  "change-contract",
  "weaken-test",
  "raise-spend",
  "raise-privilege",
]);

export function authorize(operation) {
  if (!CRITICAL.has(operation?.kind)) return { run: true };
  if (!operation.approvedBy) return { run: false, reason: "human approval missing" };
  return { run: true, approvedBy: operation.approvedBy };
}

export function nextAttempt(state, failure) {
  const failures = [...(state.failures ?? []), failure];
  const repeats = failures.filter((item) => item.id === failure.id).length;
  const ceiling = state.ceiling ?? 2;
  return {
    failures,
    agent: state.agent,
    maySwitch: repeats >= 2,
    stopped: failures.length >= ceiling,
    contractHash: state.contractHash,
  };
}

export function runSubtasks(subtasks, runOne) {
  const results = [];
  for (const subtask of subtasks) {
    results.push({ ...runOne(subtask), allowList: subtask.allowList.slice() });
  }
  return results;
}

export function trace(input) {
  return {
    chain: {
      task: input.task,
      revision: input.revision,
      checks: input.checks,
      model: input.model,
      evidence: input.evidence,
    },
    valid: input.decisionRevision === input.revision && Boolean(input.evidence),
  };
}

export function appendDecision(history, decision) {
  const priorBlock = history.some((item) => item.evidence === decision.evidence && item.decision === "block");
  const entry = {
    who: decision.who,
    decision: priorBlock ? "block" : decision.decision,
    evidence: decision.evidence,
  };
  if (decision.explanation) entry.explanation = decision.explanation;
  return [...history, entry];
}

export function recordEdit(history, edit) {
  return [...history, { agent: edit.agent, model: edit.model, task: edit.task, path: edit.path }];
}
