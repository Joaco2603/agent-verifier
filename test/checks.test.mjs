import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";
import { runChecks } from "../src/checks/run.mjs";

const contract = parse(readFileSync(new URL("../contracts/RF-01.yaml", import.meta.url), "utf8"));

function rejectOverdraft({ balance }) {
  return { status: "REJECTED", balance_unchanged: true, transaction_created: false, balance_after: balance };
}

test("a failing unit names the check and is not accepted", () => {
  const result = runChecks({
    requirementId: "RF-01",
    unit: [{ name: "rejects overdraft", pass: false, failure: "accepted the transfer" }],
    harness: () => ({ pass: true }),
  });
  const unit = result.results.find((row) => row.kind === "unit");
  assert.equal(unit.state, "FAIL");
  assert.equal(unit.requirementId, "RF-01");
  assert.equal(unit.failure, "accepted the transfer");
  assert.equal(result.accepted, false);
});

test("a missing harness is UNKNOWN and a present harness records the path", () => {
  const missing = runChecks({ requirementId: "RF-01", unit: [{ name: "ok", pass: true }] });
  const present = runChecks({
    requirementId: "RF-01",
    unit: [{ name: "ok", pass: true }],
    changedPath: "src/pay.js",
    harness: (path) => ({ pass: true, path }),
  });
  assert.equal(missing.results.find((row) => row.kind === "integration").state, "UNKNOWN");
  assert.equal(missing.accepted, false);
  assert.equal(present.results.find((row) => row.kind === "integration").result.path, "src/pay.js");
});

test("a rewritten regression blocks, and a contract case names the revision", () => {
  const rewritten = runChecks({
    requirementId: "RF-01",
    harness: () => ({ pass: true }),
    regression: [{ observation: "status", expected: "REJECTED", actual: "REJECTED", rewritten: true }],
  });
  assert.equal(rewritten.results.find((row) => row.kind === "regression").reason, "critical test edited");
  let calls = 0;
  const broken = structuredClone(contract);
  broken.cases[0].input.amount = -50;
  const skipped = runChecks({
    requirementId: "RF-01",
    harness: () => ({ pass: true }),
    contract: broken,
    implementation: () => {
      calls += 1;
      return rejectOverdraft({ balance: 100 });
    },
  });
  assert.equal(calls, 0);
  const ran = runChecks({
    requirementId: "RF-01",
    harness: () => ({ pass: true }),
    contract,
    implementation: () => ({ status: "ACCEPTED", balance_unchanged: false, transaction_created: true, balance_after: -50 }),
  });
  const failed = ran.results.find((row) => row.kind === "case");
  assert.equal(failed.state, "FAIL");
  assert.equal(failed.id, "overdraft-rejected");
  assert.equal(failed.revision, 1);
});

test("passes and an explanation leave a critical security block in place", () => {
  const result = runChecks({
    requirementId: "RF-01",
    unit: [{ name: "ok", pass: true }],
    harness: () => ({ pass: true }),
    contract,
    implementation: ({ balance }) => rejectOverdraft({ balance }),
    explanation: "the model says PASS",
    score: 0,
    security: { finding: "missing permission", permission: "transfer", action: "admin" },
  });
  assert.equal(result.results.find((row) => row.kind === "unit").state, "PASS");
  assert.equal(result.results.find((row) => row.kind === "case").state, "PASS");
  assert.equal(result.explanation, "the model says PASS");
  assert.equal(result.block, true);
  assert.equal(result.score, 0);
  assert.equal(result.accepted, false);
  assert.equal(result.finding, "missing permission");
});

test("unseen concurrency, infrastructure, or live data stays UNKNOWN", () => {
  let calls = 0;
  const result = runChecks({
    requirementId: "RF-01",
    harness: () => ({ pass: true }),
    contract,
    unseen: ["live data"],
    implementation: () => {
      calls += 1;
      return rejectOverdraft({ balance: 100 });
    },
  });
  assert.equal(calls, 0);
  assert.equal(result.results.find((row) => row.kind === "case").state, "UNKNOWN");
  assert.equal(result.accepted, false);
});

test("a hold template is rejected and an unapproved contract does not run", () => {
  let calls = 0;
  const extra = runChecks({ contract: { ...contract, authorization: true }, implementation: () => {
    calls += 1;
  } });
  const draft = structuredClone(contract);
  draft.approval.status = "draft";
  const unapproved = runChecks({ contract: draft, implementation: () => {
    calls += 1;
    return rejectOverdraft({ balance: 100 });
  }, harness: () => ({ pass: true }) });
  assert.equal(extra.rejected, true);
  assert.equal(unapproved.results.find((row) => row.kind === "contract").reason, "unapproved");
  assert.equal(calls, 0);
});

test("the suite cannot sit inside the agent allow-list, and a pass is not a proof", () => {
  const inside = runChecks({
    requirementId: "RF-01",
    allowList: ["src/"],
    suitePath: "src/checks/run.mjs",
    unit: [{ name: "ok", pass: true }],
    harness: () => ({ pass: true }),
  });
  const outside = runChecks({
    requirementId: "RF-01",
    allowList: ["src/"],
    suitePath: "verifier/suite.mjs",
    unit: [{ name: "ok", pass: true }],
    harness: () => ({ pass: true }),
  });
  assert.equal(inside.accepted, false);
  assert.equal(inside.reason, "suite is writable by the agent");
  assert.equal(outside.accepted, true);
  assert.equal(outside.proof, false);
});
