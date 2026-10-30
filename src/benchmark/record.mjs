function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) return sorted[mid];
  return (sorted[mid - 1] + sorted[mid]) / 2;
}

function counted(rows, key) {
  const marked = rows.some((row) => typeof row[key] === "boolean");
  return marked ? rows.filter((row) => row[key] === true).length : null;
}

function costOf(cost) {
  if (cost == null) return { gap: "cost" };
  return {
    time: cost.time == null ? { gap: "time" } : cost.time,
    price: cost.price == null ? { gap: "price" } : cost.price,
  };
}

export function recordBenchmark({ rows = [], cost = null, explanation = null } = {}) {
  const gain = rows
    .filter((row) => row.gate === "FAIL" && row.agentTests === "PASS" && row.weak !== true && row.falseAlarm !== true)
    .map((row) => ({
      defectId: row.defectId,
      contractId: row.contractId,
      revision: row.revision,
      raw: row.raw,
    }));
  const minutes = rows.map((row) => row.approvalMinutes);
  const measuredMinutes = minutes.filter((value) => typeof value === "number");
  const judged = rows.length > 0 && rows.every((row) => row.falseAcceptJudged === true);
  const runner = {
    label: "runner decision",
    C: gain.length,
    F: judged ? rows.filter((row) => row.falseAccept === true).length : null,
    W: rows.filter((row) => row.weak === true).length,
    M: measuredMinutes.length === rows.length && rows.length > 0 ? median(measuredMinutes) : null,
  };
  runner.build = runner.M != null && runner.F != null && runner.C >= 10 && runner.F <= 2 && runner.W <= 3 && runner.M <= 25;
  return {
    gain,
    escape: {
      count: counted(rows, "escaped"),
      definition: "defects that left the gate and showed up later",
    },
    falseAlarms: {
      count: counted(rows, "falseAlarm"),
      definition: "failures the gate reports that are not defects",
    },
    cost: {
      ...costOf(cost),
      definition: "verification time plus any price already logged",
    },
    coverage: {
      passed: rows.filter((row) => row.requirement === "passed").length,
      failed: rows.filter((row) => row.requirement === "failed").length,
      vague: rows.filter((row) => row.requirement === "vague").length,
      definition: "how many requirements passed, failed, or were too vague to check",
    },
    security: rows
      .filter((row) => row.security === true)
      .map((row) => ({ defectId: row.defectId, contractId: row.contractId, raw: row.raw })),
    runner,
    explanation,
  };
}
