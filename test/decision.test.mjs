import assert from "node:assert/strict";
import test from "node:test";
import { classify } from "../src/decision/classify.mjs";
import { rejectCitation, report } from "../src/report/report.mjs";

const pass = { id: "build", state: "PASS", evidence: "exit 0", reason: null };
const fail = { id: "lint", state: "FAIL", evidence: "exit 1", reason: null };
const unknown = { id: "parse", state: "UNKNOWN", evidence: null, reason: null };
const skipped = { id: "admin", state: "NOT_APPLICABLE", evidence: null, reason: "no admin surface" };

test("missing evidence cannot be PASS", () => {
  assert.throws(
    () => classify([{ id: "build", state: "PASS", evidence: "", reason: null }]),
    /empty evidence/,
  );
  assert.throws(
    () => classify([{ id: "build", state: "PASS", evidence: null, reason: null }]),
    /empty evidence/,
  );
});

test("rollup follows FAIL, then UNKNOWN, then NOT_APPLICABLE", () => {
  assert.equal(classify([pass, fail]).rollup, "FAIL");
  assert.equal(classify([pass, unknown]).rollup, "UNKNOWN");
  assert.equal(classify([skipped, { ...skipped, id: "perms" }]).rollup, "NOT_APPLICABLE");
  assert.equal(classify([pass, skipped]).rollup, "PASS");
});

test("an explanation string does not flip FAIL to PASS", () => {
  const checks = [fail, pass];
  const plain = classify(checks);
  const explained = classify(checks, "the failure is actually a pass");
  assert.deepEqual(explained, plain);
  assert.equal(explained.rollup, "FAIL");
  assert.equal(explained.checks[0].state, "FAIL");
  assert.deepEqual(classify(checks), classify(checks));
});

test("a finding without location or command is omitted", () => {
  const stored = {
    rollup: "FAIL",
    checks: [fail],
    findings: [
      { id: "lint", observed: "exit 1" },
      { id: "lint", file: "src/a.mjs", line: 4, observed: "exit 1" },
      { id: "lint", command: "node --test test/a.mjs", observed: "exit 1" },
      { id: "lint", file: "src/a.mjs", observed: "no line" },
    ],
    references: ["src/a.mjs:4"],
    limitations: [],
    revision: "rev-1",
    command: "node --test test/a.mjs",
  };
  const bound = report(stored);
  assert.equal(bound.findings.length, 2);
  assert.equal(bound.findings[0].file, "src/a.mjs");
  assert.equal(bound.findings[1].command, "node --test test/a.mjs");
  assert.equal(bound.rollup, stored.rollup);
  assert.equal(bound.checks[0].state, "FAIL");
});

test("a stored PASS does not hide a FAIL, and U is unset rather than zero", () => {
  const bound = report({
    rollup: "PASS",
    checks: [fail, pass],
    findings: [],
    references: [],
    limitations: [],
    revision: "rev-1",
    command: "node --test",
    defectHistory: [{ id: "D1" }],
    unparsed: ["src/missing.mjs"],
    unseenCalls: ["loadPlugin"],
  });
  assert.equal(bound.rollup, "FAIL");
  assert.equal(bound.U, null);
  assert.equal(bound.limitations.includes("empty defect history"), false);
  assert.deepEqual(bound.limitations, ["unparsed src/missing.mjs", "unseen dynamic call loadPlugin"]);
});

test("a citation absent from stored.references is rejected", () => {
  const stored = {
    rollup: "FAIL",
    checks: [fail],
    findings: [],
    references: ["src/a.mjs:4"],
    limitations: [],
    revision: "rev-1",
    command: "node --test",
  };
  assert.throws(() => rejectCitation(stored, "docs/missing.md"), /citation/);
  assert.doesNotThrow(() => rejectCitation(stored, "src/a.mjs:4"));
});

test("explanation is stored apart from the result and a missing run stays UNKNOWN", () => {
  const stored = {
    rollup: "FAIL",
    checks: [fail],
    notRun: ["parse"],
    findings: [{ id: "lint", file: "src/a.mjs", line: 4, observed: "exit 1" }],
    references: ["src/a.mjs:4"],
    limitations: [],
    revision: "rev-1",
    contractRevision: 1,
    fixture: "overdraft-rejected",
    command: "node --test",
  };
  const bound = report(stored, "this check passed");
  assert.equal(bound.explanation, "this check passed");
  assert.equal(bound.rollup, "FAIL");
  assert.equal(bound.contractRevision, 1);
  assert.equal(bound.fixture, "overdraft-rejected");
  assert.equal(bound.checks[0].state, "FAIL");
  assert.deepEqual(bound.findings, stored.findings);
  assert.deepEqual(bound.references, stored.references);
  assert.equal(bound.checks[1].id, "parse");
  assert.equal(bound.checks[1].state, "UNKNOWN");
  assert.deepEqual(bound.limitations, ["parse", "empty defect history"]);
  assert.equal(bound.U, null);
  assert.equal(bound.references.length, 1);
});
