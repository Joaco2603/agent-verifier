import assert from "node:assert/strict";
import test from "node:test";
import { fns } from "../experiments/agent-fns.mjs";
import { tasks } from "../experiments/corpus.mjs";
import { shapeFalseAlarm, simulateFollowup } from "../src/experiment/followup.mjs";

test("a renamed field is a shape miss and a wrong value is not", () => {
  assert.equal(shapeFalseAlarm({ price: 90, allowed: true }, { total: 90 }), true);
  assert.equal(shapeFalseAlarm({ value: 2 }, { rounded: 2 }), true);
  assert.equal(shapeFalseAlarm({ days: 0 }, { days: 1 }), false);
  assert.equal(shapeFalseAlarm(null, { count: 0 }), false);
});

test("the follow-up simulation stays out of the runner and names its limits", () => {
  const report = simulateFollowup(tasks, fns);
  assert.equal(report.manualReview, false);
  assert.equal("runner" in report, false);
  assert.equal(report.cost.price, null);
  assert.equal(typeof report.cost.time, "number");
  assert.ok(report.cost.time >= 0);
  assert.equal(report.escapes.count, 0);
  assert.match(report.escapes.limit, /no later run/);
  assert.deepEqual(report.falseAlarms.ids, ["RF-01", "RF-03"]);
  assert.equal(report.falseAlarms.count, 2);
  assert.match(report.falseAlarms.limit, /person has not reviewed/);
});
