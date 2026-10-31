import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, rmSync, statSync, symlinkSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { decide, receiptFile, recallPrevious } from "../src/freeze/cli.mjs";
import { readCandidate } from "../src/freeze/read.mjs";

test("the freeze script cites the real HEAD and does not approve from this tree", () => {
  const temp = mkdtempSync(join(tmpdir(), "freeze-private-"));
  try {
    const head = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
    const candidate = readCandidate();
    assert.equal(candidate.hash, head.stdout.trim());
    const run = spawnSync(process.execPath, ["src/freeze/cli.mjs"], {
      encoding: "utf8",
      env: { ...process.env, TMPDIR: temp },
    });
    const result = JSON.parse(run.stdout);
    assert.equal(run.status, 1);
    assert.equal(result.hash, head.stdout.trim());
    assert.equal(result.approved, false);
    if (candidate.diff.length === 0) assert.equal(result.reason, "diff not visible");
    assert.equal("commit" in result, false);
    assert.equal("push" in result, false);
    assert.equal("merge" in result, false);
    const mode = statSync(result.resultFile).mode;
    assert.equal(mode & 0o222, 0);
    assert.throws(() => writeFileSync(result.resultFile, "edited"));
  } finally {
    rmSync(temp, { recursive: true, force: true });
  }
});

test("risk stays on the candidate instead of defaulting to low", () => {
  const diff = "diff --git a/src/pay.js b/src/pay.js\n";
  const checks = [{ id: "build", state: "PASS", evidence: "exit 0", reason: null }];
  assert.equal(decide({ hash: "abc", diff }, { checks }).depth, "full");
  assert.equal(
    decide({ hash: "abc", diff, risk: "low", assessment: "ok", budgetHit: false }, { checks }).depth,
    "structural",
  );
});

test("unreadable checks refuse without approving", () => {
  const temp = mkdtempSync(join(tmpdir(), "freeze-private-"));
  const dir = mkdtempSync(join(tmpdir(), "freeze-checks-"));
  try {
    const checks = join(dir, "checks.json");
    writeFileSync(checks, "{");
    const run = spawnSync(process.execPath, ["src/freeze/cli.mjs", checks], {
      encoding: "utf8",
      env: { ...process.env, TMPDIR: temp },
    });
    const result = JSON.parse(run.stdout);
    assert.equal(run.status, 1);
    assert.equal(result.approved, false);
    assert.equal(result.reason, "input not readable");
    assert.equal(statSync(result.resultFile).mode & 0o222, 0);
  } finally {
    rmSync(temp, { recursive: true, force: true });
    rmSync(dir, { recursive: true, force: true });
  }
});

test("the cli reloads a receipt and does not follow a linked one", () => {
  const dir = mkdtempSync(join(process.cwd(), ".tmp-freeze-"));
  const env = {
    ...process.env,
    GIT_AUTHOR_NAME: "t",
    GIT_AUTHOR_EMAIL: "t@example.com",
    GIT_COMMITTER_NAME: "t",
    GIT_COMMITTER_EMAIL: "t@example.com",
  };
  const git = (args) => execFileSync("git", args, { cwd: dir, env });
  let receipt = "";
  try {
    git(["init"]);
    git(["commit", "--allow-empty", "-m", "init"]);
    const hash = git(["rev-parse", "HEAD"]).toString().trim();
    const repo = git(["rev-parse", "--show-toplevel"]).toString().trim();
    writeFileSync(join(dir, "pay.js"), "x\n");
    receipt = receiptFile(hash, repo);
    const kept = { hash, repo, candidateId: "kept", approved: false, rollup: "FAIL", correction: true };
    writeFileSync(receipt, `${JSON.stringify(kept)}\n`);
    const cli = join(process.cwd(), "src/freeze/cli.mjs");
    const bad = join(dir, "checks.json");
    writeFileSync(bad, "{");
    const preserved = spawnSync(process.execPath, [cli, bad], { cwd: dir, encoding: "utf8" });
    assert.equal(JSON.parse(preserved.stdout).reason, "input not readable");
    assert.equal(JSON.parse(readFileSync(receipt, "utf8")).candidateId, "kept");
    writeFileSync(receipt, `${JSON.stringify({ hash, repo, candidateId: "different", approved: true, rollup: "PASS" })}\n`);
    const checks = join(dir, "pass.json");
    writeFileSync(checks, `${JSON.stringify([{ id: "build", state: "PASS", evidence: "exit 0", reason: null }])}\n`);
    const run = spawnSync(process.execPath, [cli, checks], { cwd: dir, encoding: "utf8" });
    const result = JSON.parse(run.stdout);
    assert.equal(result.reason, undefined);
    assert.equal(result.approved, true);
    const ledger = JSON.parse(readFileSync(receipt, "utf8"));
    assert.equal(ledger.entries.different.approved, true);
    assert.equal(ledger.entries[result.candidateId].approved, true);
    const firstId = result.candidateId;
    chmodSync(receipt, 0o644);
    ledger.entries[firstId].approved = false;
    ledger.entries[firstId].correction = true;
    writeFileSync(receipt, `${JSON.stringify(ledger)}\n`);
    writeFileSync(join(dir, "pay.js"), "y\n");
    const moved = JSON.parse(spawnSync(process.execPath, [cli, checks], { cwd: dir, encoding: "utf8" }).stdout);
    assert.equal(moved.approved, true);
    assert.notEqual(moved.candidateId, firstId);
    assert.equal(JSON.parse(readFileSync(receipt, "utf8")).entries[firstId].correction, true);
    writeFileSync(join(dir, "pay.js"), "x\n");
    const back = JSON.parse(spawnSync(process.execPath, [cli, checks], { cwd: dir, encoding: "utf8" }).stdout);
    assert.equal(back.approved, false);
    assert.equal(back.reason, "correction already used");
    const replay = JSON.parse(spawnSync(process.execPath, [cli, checks, receipt], { cwd: dir, encoding: "utf8" }).stdout);
    assert.equal(replay.approved, false);
    assert.equal(replay.reason, "correction already used");
    const forged = join(tmpdir(), `freeze-old-${hash}.json`);
    writeFileSync(forged, `${JSON.stringify({ entries: { [firstId]: { hash, candidateId: firstId, approved: false, rollup: "FAIL" } } })}\n`);
    const bypass = JSON.parse(spawnSync(process.execPath, [cli, checks, forged], { cwd: dir, encoding: "utf8" }).stdout);
    assert.equal(bypass.approved, false);
    assert.equal(bypass.reason, "correction already used");
    assert.equal(JSON.parse(readFileSync(receipt, "utf8")).entries[firstId].correction, true);
    const target = join(dir, "secret.txt");
    writeFileSync(target, "secret");
    unlinkSync(receipt);
    symlinkSync(target, receipt);
    const linked = recallPrevious(hash, repo);
    assert.equal(linked.error instanceof Error, true);
    const blocked = spawnSync(process.execPath, [cli], { cwd: dir, encoding: "utf8" });
    const refusal = JSON.parse(blocked.stdout);
    assert.equal(refusal.reason, "receipt not writable");
    assert.equal(readFileSync(target, "utf8"), "secret");
  } finally {
    if (receipt) {
      try {
        unlinkSync(receipt);
      } catch {
        // The receipt was already removed.
      }
    }
    rmSync(dir, { recursive: true, force: true });
  }
});

test("a second pass on a different diff does not count as the one correction", () => {
  const diff = "diff --git a/src/pay.js b/src/pay.js\n";
  const checks = [{ id: "build", state: "FAIL", evidence: "exit 1", reason: null }];
  const first = decide({ hash: "abc", diff }, { checks });
  const second = decide({ hash: "abc", diff: `${diff}+` }, { checks, previous: first });
  const third = decide({ hash: "abc", diff }, {
    checks,
    previous: { ...first, correction: true },
  });
  assert.equal(second.reason, "candidate changed");
  assert.equal(second.approved, false);
  assert.equal(third.reason, "correction already used");
  assert.equal(third.approved, false);
});
