import assert from "node:assert/strict";
import test from "node:test";
import { freezeCandidate } from "../src/freeze/freeze.mjs";

const diffA = "diff --git a/src/a.mjs b/src/a.mjs\n--- a/src/a.mjs\n+++ b/src/a.mjs\n";
const diffB = "diff --git a/src/b.mjs b/src/b.mjs\n--- a/src/b.mjs\n+++ b/src/b.mjs\n";
const contractDiff = "diff --git a/contracts/rule.yaml b/contracts/rule.yaml\n--- a/contracts/rule.yaml\n+++ b/contracts/rule.yaml\n";

function input(overrides = {}) {
  return {
    hash: "abc123",
    diff: diffA,
    risk: "low",
    assessment: "ok",
    budgetHit: false,
    checks: [{ id: "build", state: "PASS", evidence: "exit 0", reason: null }],
    previous: null,
    ...overrides,
  };
}

test("freeze cites the hash and a changed diff changes candidateId", () => {
  const first = freezeCandidate(input());
  const second = freezeCandidate(input({ diff: diffB }));
  assert.equal(first.hash, "abc123");
  assert.equal(first.candidateId.startsWith("abc123:"), true);
  assert.notEqual(first.candidateId, second.candidateId);
  assert.equal(freezeCandidate(input()).candidateId, first.candidateId);
});

test("low risk uses structural depth and high risk uses full", () => {
  assert.equal(freezeCandidate(input({ risk: "low" })).depth, "structural");
  assert.equal(freezeCandidate(input({ risk: "high" })).depth, "full");
  assert.equal(freezeCandidate(input({ budgetHit: true })).depth, "full");
  assert.equal(freezeCandidate(input({ assessment: "failed" })).depth, "full");
});

test("critical FAIL is not approved", () => {
  const result = freezeCandidate(input({
    checks: [
      { id: "build", state: "PASS", evidence: "exit 0", reason: null },
      { id: "auth", state: "FAIL", evidence: "reproduced", reason: null, critical: true },
    ],
  }));
  assert.equal(result.approved, false);
  assert.equal(result.rollup, "FAIL");
});

test("UNKNOWN is not approved", () => {
  const result = freezeCandidate(input({
    checks: [{ id: "parse", state: "UNKNOWN", evidence: null, reason: null }],
  }));
  assert.equal(result.rollup, "UNKNOWN");
  assert.equal(result.approved, false);
});

test("missing diff is not approved", () => {
  const missingDiff = freezeCandidate(input({ diff: "" }));
  const missingHash = freezeCandidate(input({ hash: "" }));
  assert.equal(missingDiff.approved, false);
  assert.equal(missingDiff.reason, "diff not visible");
  assert.equal(missingHash.approved, false);
  assert.equal(missingHash.reason, "diff not visible");
});

test("a contract diff is not approved", () => {
  const result = freezeCandidate(input({ diff: contractDiff }));
  assert.equal(result.approved, false);
  assert.equal(result.reason, "contract edited");
  assert.equal(result.hash, "abc123");
});

test("a second attempt with a different diff does not count", () => {
  const first = freezeCandidate(input({
    checks: [{ id: "build", state: "FAIL", evidence: "exit 1", reason: null }],
  }));
  const second = freezeCandidate(input({ diff: diffB, previous: first }));
  assert.equal(second.approved, false);
  assert.equal(second.reason, "candidate changed");
  assert.equal(second.correction, undefined);
});

test("a non-severe failure stays visible and does not block the freeze", () => {
  const result = freezeCandidate(input({
    checks: [{ id: "style", state: "FAIL", evidence: "name", reason: null }],
  }));
  assert.equal(result.rollup, "FAIL");
  assert.equal(result.approved, true);
});

test("one correction is allowed and a third call is rejected", () => {
  const failed = freezeCandidate(input({
    checks: [{ id: "auth", state: "FAIL", evidence: "reproduced", reason: null, critical: true }],
  }));
  assert.equal(failed.approved, false);
  const corrected = freezeCandidate(input({ previous: failed }));
  assert.equal(corrected.approved, true);
  assert.equal(corrected.correction, true);
  assert.equal(corrected.candidateId, failed.candidateId);
  const third = freezeCandidate(input({ previous: corrected }));
  assert.equal(third.approved, false);
  assert.equal(third.reason, "correction already used");
});

test("the result object has no commit, push, or merge keys", () => {
  const result = freezeCandidate(input());
  const keys = Object.keys(result);
  assert.equal(keys.includes("commit"), false);
  assert.equal(keys.includes("push"), false);
  assert.equal(keys.includes("merge"), false);
  assert.equal(JSON.stringify(result).includes("commit"), false);
});
