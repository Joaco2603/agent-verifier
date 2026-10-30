import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { chmodSync, statSync, writeFileSync } from "node:fs";
import test from "node:test";
import { decide } from "../src/freeze/cli.mjs";
import { readCandidate } from "../src/freeze/read.mjs";

test("the freeze script cites the real HEAD and does not approve from this tree", () => {
  const head = spawnSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" });
  const candidate = readCandidate();
  assert.equal(candidate.hash, head.stdout.trim());
  assert.equal(candidate.diff.length > 0, true);
  const run = spawnSync(process.execPath, ["src/freeze/cli.mjs"], { encoding: "utf8" });
  const result = JSON.parse(run.stdout);
  assert.equal(run.status, 1);
  assert.equal(result.hash, head.stdout.trim());
  assert.equal(result.approved, false);
  assert.equal("commit" in result, false);
  assert.equal("push" in result, false);
  assert.equal("merge" in result, false);
  const mode = statSync(result.resultFile).mode;
  assert.equal(mode & 0o222, 0);
  assert.throws(() => writeFileSync(result.resultFile, "edited"));
  chmodSync(result.resultFile, 0o644);
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
