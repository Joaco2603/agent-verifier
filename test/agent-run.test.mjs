import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fns } from "../experiments/agent-fns.mjs";
import { tasks } from "../experiments/corpus.mjs";
import { recordBenchmark } from "../src/benchmark/record.mjs";
import { measureAgent } from "../src/experiment/agent-run.mjs";

test("agent tests pass and contract misses stay unlabeled as false accepts", () => {
  const agent = spawnSync(process.execPath, ["--test", "test/agent-fns.test.mjs"], { encoding: "utf8" });
  assert.equal(agent.status, 0);
  assert.equal(fns.length, tasks.length);
  const measured = measureAgent(tasks, fns, true);
  assert.equal(typeof measured.C, "number");
  assert.equal(measured.C, measured.rows.filter((row) => row.contractFailed).length);
  assert.equal(measured.F, null);
  assert.equal(measured.M, null);
  assert.equal(measured.runner, false);
  assert.equal(measured.C + measured.needsHuman.length, 20);
});

test("the live corpus withholds F and M, so the runner stays unbuilt", () => {
  const measured = measureAgent(tasks, fns, true);
  const report = recordBenchmark({
    rows: measured.rows.map((row) => ({
      defectId: row.id,
      contractId: row.id,
      revision: 1,
      gate: row.contractFailed ? "FAIL" : "PASS",
      agentTests: "PASS",
      weak: false,
      requirement: row.contractFailed ? "failed" : "passed",
      raw: "contract case",
    })),
  });
  assert.equal(report.runner.C, 20);
  assert.equal(report.runner.F, null);
  assert.equal(report.runner.M, null);
  assert.equal(report.runner.build, false);
  assert.equal(report.cost.gap, "cost");
  assert.equal(report.escape.count, null);
  assert.equal(report.falseAlarms.count, null);
  assert.equal(report.coverage.failed, 20);
  assert.equal(report.coverage.passed, 0);
  assert.equal(report.coverage.vague, 0);
});
