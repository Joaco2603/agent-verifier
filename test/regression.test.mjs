import assert from "node:assert/strict";
import test from "node:test";
import { reRun, waitingReport } from "../src/checks/regression.mjs";

const approved = "status: REJECTED\n";

function contract(overrides) {
  return {
    id: "RF-01",
    operation: "transfer",
    files: ["src/pay.js"],
    priority: "critical",
    revision: 1,
    bytes: approved,
    approvedBytes: approved,
    prior: "PASS",
    next: "PASS",
    raw: "status REJECTED",
    ...overrides,
  };
}

test("a fix records the diff, the selected contracts, and the omitted ones", () => {
  const result = reRun({
    diff: "src/pay.js\n",
    targetId: "RF-09",
    contracts: [contract({}), contract({ id: "RF-02", operation: "refund", files: ["src/refund.js"] })],
  });
  assert.equal(result.overlap.includes("operation"), true);
  assert.deepEqual(result.selected, ["RF-01"]);
  assert.deepEqual(result.omitted, ["RF-02"]);
  assert.equal(result.accepted, true);
  assert.equal(result.proof, false);
});

test("a new failure is a regression, an unknown critical contract blocks, and a model summary does not pass it", () => {
  const failed = reRun({
    diff: "transfer\n",
    targetId: "RF-09",
    modelSummary: "no regression",
    contracts: [contract({ next: "FAIL", raw: "status ACCEPTED" })],
  });
  const unknown = reRun({
    diff: "src/other.js\n",
    targetId: "RF-01",
    contracts: [contract({ next: "UNKNOWN", files: [] })],
  });
  assert.equal(failed.accepted, false);
  assert.equal(failed.regressions[0].reason, "regression");
  assert.equal(failed.regressions[0].raw, "status ACCEPTED");
  assert.equal(failed.modelSummary, "no regression");
  assert.equal(unknown.accepted, false);
  assert.equal(unknown.regressions[0].reason, "unknown on critical");
  assert.deepEqual(unknown.selected, ["RF-01"]);
});

test("an edited oracle and a contract diff block the re-run", () => {
  const edited = reRun({
    diff: "src/pay.js\n",
    targetId: "RF-01",
    contracts: [contract({ bytes: "status: ACCEPTED\n" })],
  });
  const diff = reRun({ diff: "diff --git a/contracts/RF-01.yaml b/contracts/RF-01.yaml\n", contracts: [] });
  assert.equal(edited.regressions[0].reason, "oracle edited");
  assert.equal(diff.reason, "contract edited");
  assert.equal(diff.accepted, false);
});

test("waiting checks name the missing benchmark result and have no suite", () => {
  const report = waitingReport({});
  assert.equal(report.length, 7);
  assert.equal(report.every((item) => item.justified === false && item.suite === false && item.needs.length > 0), true);
  const recorded = waitingReport({ fuzz: "crash in parse on an example that passed" });
  assert.equal(recorded.find((item) => item.technique === "fuzz").justified, true);
  assert.equal(recorded.find((item) => item.technique === "fuzz").suite, false);
});
