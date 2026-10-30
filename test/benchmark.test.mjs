import assert from "node:assert/strict";
import test from "node:test";
import { recordBenchmark } from "../src/benchmark/record.mjs";

function row(overrides) {
  return {
    defectId: "D1",
    contractId: "RF-01",
    revision: 1,
    gate: "PASS",
    agentTests: "PASS",
    approvalMinutes: 20,
    requirement: "passed",
    raw: "status REJECTED",
    ...overrides,
  };
}

test("gain lists gate catches whose agent tests passed, and pass rate is absent", () => {
  const report = recordBenchmark({
    rows: [
      row({ defectId: "catch", gate: "FAIL", agentTests: "PASS", requirement: "failed" }),
      row({ defectId: "both-fail", gate: "FAIL", agentTests: "FAIL" }),
      row({ defectId: "weak", gate: "FAIL", agentTests: "PASS", weak: true }),
    ],
    cost: { time: 12, price: null },
    explanation: "this should say the gain is huge",
  });
  assert.deepEqual(report.gain, [{ defectId: "catch", contractId: "RF-01", revision: 1, raw: "status REJECTED" }]);
  assert.equal("passRate" in report, false);
  assert.equal("score" in report, false);
  assert.equal(report.explanation, "this should say the gain is huge");
  assert.deepEqual(report.cost.price, { gap: "price" });
  assert.equal(report.cost.price, report.cost.price);
  assert.notEqual(report.cost.price, 0);
});

test("an unjudged false-accept column does not count as zero and does not build a runner", () => {
  const rows = Array.from({ length: 10 }, (_, index) => row({
    defectId: `c${index}`,
    gate: "FAIL",
    agentTests: "PASS",
    approvalMinutes: 10,
  }));
  const report = recordBenchmark({ rows, cost: { time: 1, price: 0 } });
  assert.equal(report.runner.C, 10);
  assert.equal(report.runner.F, null);
  assert.equal(report.runner.M, 10);
  assert.equal(report.runner.build, false);
});

test("a missing cost is a gap, and an empty benchmark does not build a runner", () => {
  const report = recordBenchmark({});
  assert.deepEqual(report.cost, { gap: "cost", definition: "verification time plus any price already logged" });
  assert.equal(report.runner.label, "runner decision");
  assert.equal(report.runner.build, false);
  assert.equal(report.runner.M, null);
});

test("the runner decision uses C, F, W, and median M, and a measured zero stays zero", () => {
  const rows = Array.from({ length: 10 }, (_, index) => row({
    defectId: `c${index}`,
    gate: "FAIL",
    agentTests: "PASS",
    approvalMinutes: 20,
    requirement: "failed",
    falseAcceptJudged: true,
    security: index === 0,
  }));
  rows.push(row({ defectId: "false-accept", falseAccept: true, falseAcceptJudged: true, approvalMinutes: 30 }));
  rows.push(row({ defectId: "escaped", escaped: true, falseAcceptJudged: true, gate: "PASS" }));
  const report = recordBenchmark({ rows, cost: { time: 4, price: 0 } });
  assert.equal(report.runner.C, 10);
  assert.equal(report.runner.F, 1);
  assert.equal(report.runner.W, 0);
  assert.equal(report.runner.M, 20);
  assert.equal(report.runner.build, true);
  assert.equal(report.escape.count, 1);
  assert.equal(report.falseAlarms.count, null);
  assert.equal(report.cost.price, 0);
  assert.equal(report.security.length, 1);
  assert.equal(report.coverage.failed, 10);
});
