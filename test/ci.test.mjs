import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { gate } from "../src/ci/gate.mjs";

const contractDiff = "diff --git a/contracts/RF-01.yaml b/contracts/RF-01.yaml\n--- a/contracts/RF-01.yaml\n+++ b/contracts/RF-01.yaml\n";

function runHook(change) {
  const dir = mkdtempSync(join(tmpdir(), "hook-"));
  const file = join(dir, "change.json");
  writeFileSync(file, JSON.stringify(change));
  return spawnSync(process.execPath, ["src/ci/cli.mjs", file], { encoding: "utf8" });
}

test("a critical FAIL blocks and a score does not clear it", () => {
  const result = gate({
    score: 0,
    route: "other-model",
    critical: [{ id: "RF-01", revision: 1, state: "FAIL", evidence: "status ACCEPTED" }],
  });
  assert.equal(result.accepted, false);
  assert.deepEqual(result.blocks[0], {
    id: "RF-01",
    revision: 1,
    state: "FAIL",
    evidence: "status ACCEPTED",
    reason: null,
  });
});

test("silence is not a pass", () => {
  const missing = gate({
    critical: [{ id: "RF-01", revision: 1, state: "PASS" }],
  });
  const unspoken = gate({
    critical: [{ id: "RF-01", revision: 1, state: "NOT_APPLICABLE", reason: "  " }],
  });
  const stated = gate({
    critical: [{ id: "RF-01", revision: 1, state: "NOT_APPLICABLE", reason: "no admin surface" }],
  });
  assert.equal(missing.accepted, false);
  assert.equal(missing.blocks[0].state, "UNKNOWN");
  assert.equal(missing.blocks[0].evidence, null);
  assert.equal(unspoken.accepted, false);
  assert.equal(unspoken.blocks[0].reason, "reason missing");
  assert.equal(stated.accepted, true);
});

test("a revision mismatch invalidates the run and the chain stays on the result", () => {
  const broken = gate({
    task: "transfer",
    revision: 1,
    decisionRevision: 2,
    model: "cursor",
    critical: [{ id: "RF-01", revision: 1, state: "PASS", evidence: "status REJECTED" }],
  });
  assert.equal(broken.accepted, false);
  assert.equal(broken.blocks.some((row) => row.reason === "revision mismatch"), true);
  assert.equal(broken.trace.chain.task, "transfer");
  assert.equal(broken.trace.chain.model, "cursor");
  assert.equal(broken.trace.valid, false);
  const linked = gate({
    task: "transfer",
    revision: 1,
    decisionRevision: 1,
    model: "cursor",
    critical: [{ id: "RF-01", revision: 1, state: "PASS", evidence: "status REJECTED" }],
  });
  assert.equal(linked.accepted, true);
  assert.equal(linked.trace.valid, true);
  assert.equal(linked.trace.chain.evidence, "status REJECTED");
});

test("UNKNOWN and a contract diff block", () => {
  const result = gate({
    diff: contractDiff,
    critical: [{ id: "RF-01", revision: 1, state: "UNKNOWN" }],
  });
  assert.equal(result.accepted, false);
  assert.equal(result.blocks[0].reason, "contract edited");
  assert.equal(result.blocks[1].state, "UNKNOWN");
  assert.equal(result.blocks[1].evidence, null);
});

test("a contract diff names the approved blob and a later revision does not repair the run", () => {
  const approved = [{ path: "contracts/RF-01.yaml", blob: "abc123", revision: 1, by: "product-owner" }];
  const broken = gate({
    diff: contractDiff,
    author: "router",
    score: 0,
    newRevision: 2,
    approved,
    critical: [{ id: "RF-01", revision: 2, state: "PASS", evidence: "status REJECTED" }],
  });
  assert.equal(broken.accepted, false);
  assert.equal(broken.oracle, null);
  assert.equal(broken.blocks[0].approved[0].blob, "abc123");
  assert.equal(broken.blocks[0].diff, contractDiff);
  assert.equal(broken.blocks[0].author, "router");
  const clean = gate({
    diff: "diff --git a/src/pay.js b/src/pay.js\n",
    approved,
    critical: [{ id: "RF-01", revision: 1, state: "PASS", evidence: "status REJECTED" }],
  });
  assert.equal(clean.accepted, true);
  assert.equal(clean.oracle[0].blob, "abc123");
});

test("the process exit is the block, and a non-critical failure stays a report", () => {
  const blocked = runHook({
    explanation: "this passed",
    unitTestsPass: true,
    score: 0,
    route: "other-model",
    critical: [{ id: "RF-01", revision: 1, state: "FAIL", evidence: "status ACCEPTED" }],
  });
  assert.equal(blocked.status, 1);
  const body = JSON.parse(blocked.stdout);
  assert.equal(body.blocks[0].id, "RF-01");
  assert.equal(body.blocks[0].revision, 1);
  assert.equal(body.blocks[0].state, "FAIL");
  assert.equal(body.blocks[0].evidence, "status ACCEPTED");
  const reported = runHook({
    other: [{ id: "RF-02", revision: 2, state: "FAIL", evidence: "naming" }],
    critical: [],
  });
  assert.equal(reported.status, 0);
  assert.equal(JSON.parse(reported.stdout).reported[0].id, "RF-02");
  assert.equal(gate({ other: [{ id: "RF-02", state: "FAIL", evidence: "naming" }] }).accepted, true);
});

test("a permission change stays blocked until a security check passes", () => {
  const missing = gate({ permissionChange: true, score: 0, critical: [] });
  const failed = gate({
    adminChange: true,
    score: 0,
    security: { id: "auth", revision: 1, state: "FAIL", evidence: "actor allowed" },
  });
  const passed = gate({
    permissionChange: true,
    score: 0,
    security: { id: "auth", revision: 1, state: "PASS", evidence: "actor denied" },
  });
  assert.equal(missing.accepted, false);
  assert.equal(missing.blocks[0].state, "UNKNOWN");
  assert.equal(missing.blocks[0].reason, "permission check required");
  assert.equal(failed.accepted, false);
  assert.equal(failed.blocks[0].state, "FAIL");
  assert.equal(passed.accepted, true);
});

test("an invalid contract file blocks even when the row says PASS", () => {
  const valid = gate({
    contractPath: "contracts/RF-01.yaml",
    critical: [{ id: "RF-01", revision: 1, state: "PASS", evidence: "status REJECTED" }],
  });
  assert.equal(valid.accepted, true);
  const missing = gate({ contractPath: "contracts/missing.yaml", critical: [] });
  assert.equal(missing.accepted, false);
  assert.equal(missing.blocks[0].reason, "contract unreadable");
  const dir = mkdtempSync(join(tmpdir(), "bad-contract-"));
  const bad = join(dir, "bad.yaml");
  writeFileSync(bad, "id: nope\n");
  const invalid = gate({
    contractPath: bad,
    critical: [{ id: "RF-01", revision: 1, state: "PASS", evidence: "status REJECTED" }],
  });
  assert.equal(invalid.accepted, false);
  assert.equal(invalid.blocks[0].reason, "schema");
});
