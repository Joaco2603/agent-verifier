import assert from "node:assert/strict";
import test from "node:test";
import { replay, withReplay } from "../src/report/replay.mjs";

const stored = {
  commandCheck: "build",
  checks: [{ id: "build", state: "PASS", evidence: "same", reason: null }],
  findings: [{ id: "build", command: "node -e", observed: "same" }],
  references: [],
  limitations: [],
  revision: "rev-1",
  command: "node -e",
  defectHistory: [{ id: "D1" }],
};

test("a second run of the same command matches the first", () => {
  const result = replay([process.execPath, "-e", "process.stdout.write('same')"]);
  assert.equal(result.same, true);
  assert.equal(result.first.stdout, "same");
  const bound = withReplay(stored, result);
  assert.equal(bound.rollup, "PASS");
  assert.equal(bound.checks[0].state, "PASS");
});

test("a replay that differs is not a pass", () => {
  const bound = withReplay(stored, {
    same: false,
    first: { status: 0, stdout: "a" },
    second: { status: 0, stdout: "b" },
  });
  assert.equal(bound.rollup, "UNKNOWN");
  assert.equal(bound.checks[0].state, "UNKNOWN");
  assert.equal(bound.checks[0].reason, "replay differed");
});
