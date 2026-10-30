import assert from "node:assert/strict";
import test from "node:test";
import { approveVersion, gitBlob, humanApproval, linkRequirement, loadVersion, requirementComplete } from "../src/contracts/version.mjs";
import { spawnSync } from "node:child_process";

test("the approved hash is the git blob of the file", () => {
  assert.equal(gitBlob(""), "e69de29bb2d1d6434b8b29ae775ad8c2e48c5391");
  const bytes = "status: REJECTED\n";
  const git = spawnSync("git", ["hash-object", "--stdin"], { input: bytes, encoding: "utf8" });
  assert.equal(git.status, 0);
  assert.equal(approveVersion([], bytes, "product-owner").version.hash, git.stdout.trim());
});

test("two different approvals keep different hashes and the earlier bytes stay readable", () => {
  const first = approveVersion([], "status: REJECTED\n", "product-owner");
  const second = approveVersion(first.history, "status: ACCEPTED\n", "product-owner");
  assert.notEqual(first.version.id, second.version.id);
  assert.notEqual(first.version.hash, second.version.hash);
  assert.equal(loadVersion(second.history, 1).bytes, "status: REJECTED\n");
  assert.equal(approveVersion(second.history, "again\n", "").approved, false);
});

test("a requirement without a test link stays incomplete", () => {
  const links = linkRequirement([], { requirementId: "RF-01", testId: "overdraft", reportId: "run-1" });
  assert.equal(requirementComplete(links, "RF-01").complete, true);
  assert.equal(requirementComplete(links, "RF-02").complete, false);
  assert.equal(linkRequirement(links, { requirementId: "RF-03" }).length, 1);
});

test("critical and uninterpretable drafts stay unapproved until a named record exists", () => {
  assert.equal(humanApproval({ critical: true, versionId: 1, hash: "abc" }).approved, false);
  assert.equal(humanApproval({ interpretable: false, by: "product-owner" }).approved, false);
  const approved = humanApproval({ critical: false, by: "product-owner", versionId: 1, hash: "abc" });
  assert.equal(approved.approved, true);
  assert.equal(approved.record.by, "product-owner");
});
