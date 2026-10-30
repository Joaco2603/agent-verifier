function costOf(meta) {
  const cost = meta.cost ?? {};
  return {
    model: cost.model ?? "unknown",
    inputTokens: cost.inputTokens ?? "unknown",
    outputTokens: cost.outputTokens ?? "unknown",
    wallTime: cost.wallTime ?? "unknown",
    cost: cost.cost ?? "unknown",
  };
}

function inside(path, allowList) {
  return allowList.some((entry) => path === entry || path.startsWith(entry.endsWith("/") ? entry : `${entry}/`));
}

export function startRun(config) {
  if (!config?.agent || !config.command || !config.allowList?.length || !config.contractHash) {
    return { started: false, reason: "agent not configured" };
  }
  return {
    started: true,
    agent: config.agent,
    command: config.command,
    allowList: config.allowList.slice(),
    contractHash: config.contractHash,
    criticalTests: { ...(config.criticalTests ?? {}) },
    attempts: [],
  };
}

export function attempt(run, writes, meta = {}) {
  const cost = costOf(meta);
  if (!run?.started) return { started: false, reason: "agent not configured", cost };
  if (meta.agent && meta.agent !== run.agent) {
    return { started: false, status: "blocked", reason: "agent switched", agent: run.agent, contractHash: run.contractHash, cost };
  }
  const number = meta.attempt ?? run.attempts.length + 1;
  if (number > 2) {
    return {
      started: false,
      status: "failed",
      reason: "attempt cap",
      agent: run.agent,
      contractHash: run.contractHash,
      allowList: run.allowList.slice(),
      cost,
    };
  }
  const log = [];
  const rejected = [];
  let reason = null;
  for (const write of writes) {
    if (write.path.startsWith("contracts/")) {
      reason = "contract edited";
      rejected.push(write.path);
      continue;
    }
    const approved = run.criticalTests[write.path];
    if (approved !== undefined && write.after !== approved) {
      reason = "critical test edited";
      rejected.push(write.path);
      continue;
    }
    if (!inside(write.path, run.allowList)) {
      rejected.push(write.path);
      continue;
    }
    log.push({
      path: write.path,
      before: write.before,
      after: write.after,
      agent: run.agent,
      model: meta.cost?.model ?? "unknown",
      task: meta.task ?? "unknown",
      attempt: number,
    });
  }
  const logged = new Set(log.map((entry) => entry.path));
  if ((meta.changed ?? []).some((path) => !logged.has(path))) reason = reason ?? "unlogged change";
  let status = "kept";
  if (reason) status = "blocked";
  else if (meta.failed) status = "failed";
  const result = {
    started: true,
    status,
    reason,
    agent: run.agent,
    attempt: number,
    contractHash: run.contractHash,
    allowList: run.allowList.slice(),
    log,
    rejected,
    cost,
    verificationCopy: structuredClone(log),
  };
  run.attempts.push(result);
  return result;
}
