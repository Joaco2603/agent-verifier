const HOLD = ["idempotency", "conservation", "monotonicity", "reversibility", "atomicity", "authorization", "transitions"];

function writableByAgent(allowList, suitePath) {
  if (!suitePath || !allowList?.length) return false;
  return allowList.some((entry) => suitePath === entry || suitePath.startsWith(entry.endsWith("/") ? entry : `${entry}/`));
}

function holds(actual, precondition) {
  const compare = {
    gt: (value, bound) => value > bound,
    gte: (value, bound) => value >= bound,
    lt: (value, bound) => value < bound,
    lte: (value, bound) => value <= bound,
    eq: (value, bound) => value === bound,
  }[precondition.operator];
  return typeof actual === "number" && Boolean(compare?.(actual, precondition.value));
}

function compareCase(contract, item, implementation, results) {
  for (const precondition of contract.preconditions ?? []) {
    if (!holds(item.input?.[precondition.field], precondition)) {
      results.push({
        kind: "case",
        id: item.id,
        requirementId: contract.id,
        revision: contract.revision,
        state: "FAIL",
        reason: "precondition",
      });
      return;
    }
  }
  if (!implementation) {
    results.push({ kind: "case", id: item.id, requirementId: contract.id, revision: contract.revision, state: "UNKNOWN" });
    return;
  }
  const actual = implementation(item.input);
  const mismatch = Object.entries(item.expected).some(([key, value]) => actual?.[key] !== value);
  results.push({
    kind: "case",
    id: item.id,
    requirementId: contract.id,
    revision: contract.revision,
    state: mismatch ? "FAIL" : "PASS",
    actual,
  });
}

export function runChecks(input) {
  const contract = input.contract ?? null;
  if (contract && HOLD.some((key) => Object.hasOwn(contract, key))) {
    return { rejected: true, reason: "template not in schema", proof: false };
  }
  if (writableByAgent(input.allowList, input.suitePath)) {
    return { rejected: true, accepted: false, reason: "suite is writable by the agent", results: [], proof: false };
  }
  const results = [];
  for (const unit of input.unit ?? []) {
    results.push({
      kind: "unit",
      name: unit.name,
      requirementId: input.requirementId,
      state: unit.pass ? "PASS" : "FAIL",
      failure: unit.pass ? null : unit.failure,
    });
  }
  if (typeof input.harness === "function") {
    const harnessResult = input.harness(input.changedPath);
    results.push({
      kind: "integration",
      state: harnessResult?.pass === false ? "FAIL" : "PASS",
      result: harnessResult,
    });
  } else {
    results.push({ kind: "integration", state: "UNKNOWN", reason: "harness absent" });
  }
  for (const row of input.regression ?? []) {
    if (row.rewritten || row.actual !== row.expected) {
      results.push({
        kind: "regression",
        observation: row.observation,
        state: "FAIL",
        reason: row.rewritten ? "critical test edited" : "observation mismatch",
      });
    } else {
      results.push({ kind: "regression", observation: row.observation, state: "PASS" });
    }
  }
  if (contract && contract.approval?.status !== "approved") {
    results.push({ kind: "contract", state: "UNKNOWN", reason: "unapproved", requirementId: contract.id });
  } else if ((input.unseen ?? []).some((kind) => kind === "concurrency" || kind === "infrastructure" || kind === "live data")) {
    results.push({
      kind: "case",
      requirementId: contract?.id ?? input.requirementId,
      revision: contract?.revision ?? null,
      state: "UNKNOWN",
      reason: (input.unseen ?? []).join(", "),
    });
  } else if (contract) {
    for (const item of contract.cases ?? []) compareCase(contract, item, input.implementation, results);
    for (const property of contract.properties ?? []) {
      if (!input.implementation) {
        results.push({ kind: "property", id: property.id, requirementId: contract.id, revision: contract.revision, state: "UNKNOWN" });
        continue;
      }
      const sample = contract.cases?.find((item) => (contract.preconditions ?? []).every((pre) => holds(item.input?.[pre.field], pre)));
      const actual = sample ? input.implementation(sample.input) : null;
      const value = actual?.[property.field];
      const low = typeof value === "number" && value < property.min;
      const high = property.max !== undefined && typeof value === "number" && value > property.max;
      results.push({
        kind: "property",
        id: property.id,
        requirementId: contract.id,
        revision: contract.revision,
        state: !sample || low || high || typeof value !== "number" ? "FAIL" : "PASS",
      });
    }
  }
  const security = input.security ?? {};
  let block = Boolean(security.finding);
  if (security.permission && security.action !== security.permission) block = true;
  if (contract?.priority === "critical" && !security.permission && !security.omissionApprovedBy) block = true;
  const failed = results.some((row) => row.state === "FAIL" || row.state === "UNKNOWN");
  return {
    rejected: false,
    accepted: !failed && !block,
    results,
    explanation: input.explanation ?? null,
    finding: security.finding ?? null,
    score: input.score ?? null,
    block,
    proof: false,
  };
}
