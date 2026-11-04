import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";
import { recordBenchmark } from "../src/benchmark/record.mjs";
import { annotateApproval, contractParts, normalCdf, pert, pointsForParts, reviewEstimate } from "../src/plan/pert.mjs";

test("a fixed O, likely, and P yield the PERT duration estimate", () => {
  const estimate = pert({ optimistic: 6, likely: 12, pessimistic: 30 });
  assert.equal(estimate.expected, 14);
  assert.equal(estimate.variance, 16);
  assert.equal(estimate.subjective, true);
  assert.equal(estimate.label, "duration estimate");
  assert.equal(estimate.activity, "write and approve one contract");
  assert.equal("gate" in estimate, false);
  assert.equal("approval" in estimate, false);
});

test("a subjective estimate does not become measured M", () => {
  const annotated = annotateApproval(
    [{ defectId: "RF-01", contractId: "RF-01", revision: 1, gate: "FAIL", agentTests: "PASS", requirement: "failed", raw: "case" }],
    { optimistic: 6, likely: 12, pessimistic: 30 },
  );
  assert.equal(annotated.rows[0].approvalEstimate, 14);
  assert.equal(annotated.rows[0].approvalMinutes, undefined);
  const report = recordBenchmark({ rows: annotated.rows });
  assert.equal(report.runner.M, null);
  assert.equal(report.runner.build, false);
});

test("the normal probability and the Cantelli bound review a five-part contract", () => {
  assert.ok(Math.abs(normalCdf(0) - 0.5) < 1e-6);
  assert.ok(Math.abs(normalCdf(1) - 0.841344746) < 1e-5);
  const estimate = pert(pointsForParts(5));
  const review = reviewEstimate(estimate, 25);
  assert.equal(estimate.expected, 65 / 3);
  assert.equal(estimate.variance, 25);
  assert.equal(review.holds, true);
  assert.ok(Math.abs(review.z - 2 / 3) < 1e-12);
  assert.ok(Math.abs(review.probabilityByTarget - normalCdf(2 / 3)) < 1e-12);
  assert.ok(Math.abs(review.exceedanceAtMost - 9 / 13) < 1e-12);
});

test("each corpus contract keeps the PERT identity and leaves measured M empty", () => {
  const names = readdirSync("experiments/tasks").filter((name) => name.endsWith(".yaml")).sort();
  const expected = [];
  for (const name of names) {
    const contract = parse(readFileSync(`experiments/tasks/${name}`, "utf8"));
    const estimate = pert(pointsForParts(contractParts(contract)));
    const review = reviewEstimate(estimate, 25);
    assert.equal(review.holds, true, name);
    assert.equal(estimate.subjective, true);
    expected.push(estimate.expected);
    const report = recordBenchmark({
      rows: annotateApproval(
        [{ defectId: contract.id, gate: "FAIL", agentTests: "PASS", requirement: "failed", raw: "case" }],
        pointsForParts(contractParts(contract)),
      ).rows,
    });
    assert.equal(report.runner.M, null, name);
  }
  assert.equal(names.length, 20);
  const sorted = expected.slice().sort((a, b) => a - b);
  assert.equal((sorted[9] + sorted[10]) / 2, 65 / 3);
});

test("an actual duration is the measured minute and the estimate stays beside it", () => {
  const estimate = pert({ optimistic: 6, likely: 12, pessimistic: 30, actual: 18 });
  assert.equal(estimate.subjective, false);
  assert.equal(estimate.expected, 14);
  assert.equal(estimate.actual, 18);
  const annotated = annotateApproval(
    [{ defectId: "RF-01", gate: "FAIL", agentTests: "PASS", falseAcceptJudged: true }],
    { optimistic: 6, likely: 12, pessimistic: 30, actual: 18 },
  );
  assert.equal(recordBenchmark({ rows: annotated.rows }).runner.M, 18);
});
