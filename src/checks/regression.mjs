function overlaps(diff, contract, targetId) {
  if (contract.id === targetId) return true;
  if (contract.operation && diff.includes(contract.operation)) return true;
  return (contract.files ?? []).some((file) => diff.includes(file));
}

export function reRun(input) {
  const diff = input.diff ?? "";
  const summary = { modelSummary: input.modelSummary ?? null, evidence: "check evidence", proof: false };
  if (diff.includes("diff --git a/contracts/") || diff.includes("+++ b/contracts/")) {
    return { ...summary, accepted: false, reason: "contract edited", selected: [], omitted: [], regressions: [] };
  }
  const selected = [];
  const omitted = [];
  for (const contract of input.contracts ?? []) {
    (overlaps(diff, contract, input.targetId) ? selected : omitted).push(contract.id);
  }
  const regressions = [];
  for (const contract of input.contracts ?? []) {
    if (!selected.includes(contract.id)) continue;
    if (contract.bytes !== contract.approvedBytes) {
      regressions.push({ id: contract.id, revision: contract.revision, reason: "oracle edited" });
      continue;
    }
    if (contract.priority === "critical" && contract.next === "UNKNOWN") {
      regressions.push({ id: contract.id, revision: contract.revision, raw: contract.raw ?? null, reason: "unknown on critical" });
      continue;
    }
    if (contract.prior === "PASS" && contract.next === "FAIL") {
      regressions.push({ id: contract.id, revision: contract.revision, raw: contract.raw ?? null, reason: "regression" });
    }
  }
  return {
    ...summary,
    diff,
    overlap: "operation, declared files, or the contract the fix targets",
    selected,
    omitted,
    regressions,
    accepted: regressions.length === 0,
  };
}

const WAITING = [
  ["static", "an escaped defect that unit, integration, regression, and contract checks missed, reported by a named analyzer"],
  ["property", "an approved invariant whose bounds the example tests do not cover, and a known-bad case that fails"],
  ["fuzz", "a crash, hang, or sanitizer finding that enumerated examples missed"],
  ["mutation", "a reviewed mutation that still passes the phase 1 suite"],
  ["concurrency", "two fixed schedules with different observations on shared state or ordering"],
  ["transaction", "an approved atomicity claim and an observable crash between two writes"],
  ["formal", "a benchmark case where tests and the contract checker disagree, small enough to decide without a solver"],
];

export function waitingReport(findings = {}) {
  return WAITING.map(([technique, needs]) => ({
    technique,
    needs,
    finding: findings[technique] ?? null,
    justified: findings[technique] != null,
    suite: false,
  }));
}
