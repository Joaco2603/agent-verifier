function sameInput(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

export function interpret(contract = {}, proposal = null) {
  const id = contract.id ?? "unknown";
  const defects = [];
  for (const field of ["id", "name", "cases", "observables", "limitations"]) {
    if (contract[field] === undefined) defects.push({ kind: "incomplete", id, sentences: [field] });
  }
  for (const item of contract.cases ?? []) {
    if (!item.expected || Object.keys(item.expected).length === 0) {
      defects.push({ kind: "incomplete", id, sentences: [item.id ?? "case without observation"] });
    }
  }
  if (contract.priority === "critical" && contract.gate === "report") {
    defects.push({ kind: "contradiction", id, sentences: ["priority: critical", "gate: report"] });
  }
  const evidenceIds = new Set([
    ...(contract.cases ?? []).map((item) => item.id),
    ...(contract.properties ?? []).map((item) => item.id),
  ]);
  for (const item of contract.evidence?.minimum ?? []) {
    if (!evidenceIds.has(item.ref)) {
      defects.push({ kind: "contradiction", id, sentences: [`evidence ref ${item.ref}`] });
    }
  }
  for (const item of contract.cases ?? []) {
    for (const precondition of contract.preconditions ?? []) {
      const actual = item.input?.[precondition.field];
      const compare = {
        gt: (value, bound) => value > bound,
        gte: (value, bound) => value >= bound,
        lt: (value, bound) => value < bound,
        lte: (value, bound) => value <= bound,
        eq: (value, bound) => value === bound,
      }[precondition.operator];
      if (typeof actual !== "number" || !compare?.(actual, precondition.value)) {
        defects.push({
          kind: "contradiction",
          id,
          sentences: [`case ${item.id}`, `${precondition.field} ${precondition.operator} ${precondition.value}`],
        });
      }
    }
  }
  const cases = contract.cases ?? [];
  for (let i = 0; i < cases.length; i += 1) {
    for (let j = i + 1; j < cases.length; j += 1) {
      if (sameInput(cases[i].input, cases[j].input) && !sameInput(cases[i].expected, cases[j].expected)) {
        defects.push({ kind: "ambiguity", id, sentences: [cases[i].id, cases[j].id] });
      }
    }
  }
  return { defects, proposal, approval: { status: "draft" } };
}

export function canApprove(result) {
  if (result.defects.length > 0) return false;
  return result.approval?.status === "approved";
}
