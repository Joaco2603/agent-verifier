import assert from "node:assert/strict";
import test from "node:test";
import { contractsChanged } from "../src/contracts/protect.mjs";
import { freezeCandidate } from "../src/freeze/freeze.mjs";
import { readCandidate } from "../src/freeze/read.mjs";

function fake(replies) {
  return (args) => {
    const reply = replies[args[0]];
    if (typeof reply === "function") return reply(args);
    return reply;
  };
}

const head = { status: 0, stdout: "abc\n", stderr: "" };

test("an untracked file is frozen by its blob, even when the diff names it", () => {
  const tracked = "diff --git a/src/a.mjs b/src/a.mjs\n+see contracts/new.yaml\n";
  const run = fake({
    "rev-parse": head,
    diff: { status: 0, stdout: tracked, stderr: "" },
    status: { status: 0, stdout: "?? contracts/new.yaml\0", stderr: "" },
    "hash-object": { status: 0, stdout: "deadbeef\n", stderr: "" },
  });
  const candidate = readCandidate(run);
  assert.equal(candidate.hash, "abc");
  assert.equal(candidate.diff.includes("index 0000000..deadbeef"), true);
  assert.equal(contractsChanged(candidate.diff), true);
  const changed = readCandidate(fake({
    "rev-parse": head,
    diff: { status: 0, stdout: tracked, stderr: "" },
    status: { status: 0, stdout: "?? contracts/new.yaml\0", stderr: "" },
    "hash-object": { status: 0, stdout: "cafebabe\n", stderr: "" },
  }));
  const checks = [{ id: "build", state: "PASS", evidence: "exit 0", reason: null }];
  const first = freezeCandidate({ ...candidate, risk: "low", assessment: "ok", budgetHit: false, checks });
  const second = freezeCandidate({ ...changed, risk: "low", assessment: "ok", budgetHit: false, checks });
  assert.notEqual(first.candidateId, second.candidateId);
});

test("a spaced contract path stays a contract path", () => {
  const candidate = readCandidate(fake({
    "rev-parse": head,
    diff: { status: 0, stdout: "", stderr: "" },
    status: { status: 0, stdout: "?? contracts/my file.yaml\0", stderr: "" },
    "hash-object": { status: 0, stdout: "abc123\n", stderr: "" },
  }));
  assert.equal(candidate.diff.includes('"a/contracts/my file.yaml"'), true);
  assert.equal(contractsChanged(candidate.diff), true);
});

test("a failed diff keeps HEAD and the git error", () => {
  const candidate = readCandidate(fake({
    "rev-parse": head,
    diff: { status: null, stdout: "", stderr: "", error: { message: "ENOBUFS" } },
    status: { status: 0, stdout: "", stderr: "" },
  }));
  assert.equal(candidate.hash, "abc");
  assert.equal(candidate.diff, "");
  assert.equal(candidate.error, "ENOBUFS");
});
