import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { checkContract } from "../src/contracts/check.mjs";
import { proposeContract } from "../src/contracts/propose.mjs";
import { gate } from "../src/ci/gate.mjs";

const request = {
  id: "RF-01",
  name: "Reject a transfer above the available balance",
  sentence: "Reject a transfer above the available balance.",
  priority: "critical",
  target: { operation: "transfer", inputs: ["balance", "amount"] },
  observables: [
    { name: "status", type: "string", values: ["REJECTED", "ACCEPTED"] },
    { name: "balance_unchanged", type: "boolean" },
    { name: "transaction_created", type: "boolean" },
    { name: "balance_after", type: "number" },
  ],
  preconditions: [
    { id: "amount-positive", type: "input_constraint", field: "amount", operator: "gt", value: 0 },
    { id: "balance-non-negative", type: "input_constraint", field: "balance", operator: "gte", value: 0 },
  ],
  cases: [{
    id: "overdraft-rejected",
    input: { balance: 100, amount: 150 },
    expected: { status: "REJECTED", balance_unchanged: true, transaction_created: false },
  }],
  properties: [{ id: "no-negative-balance", template: "bounded_output", field: "balance_after", min: 0 }],
  evidence: {
    minimum: [
      { kind: "example_case", ref: "overdraft-rejected" },
      { kind: "property", ref: "no-negative-balance" },
    ],
  },
  unstated: ["Does not define currency."],
  claims: [
    { kind: "precondition", id: "amount-positive", observation: "amount > 0" },
    { kind: "postcondition", id: "rejected", observation: "status is REJECTED" },
    { kind: "invariant", id: "no-negative-balance", observation: "balance_after >= 0" },
  ],
};

test("a sample request becomes a schema-valid draft and a run refuses it", () => {
  const proposed = proposeContract(request, { approval: "approved", text: "ship it" });
  assert.equal(proposed.approved, false);
  assert.equal(proposed.contract.approval.status, "draft");
  assert.deepEqual(proposed.proposal, { approval: "approved", text: "ship it" });
  const dir = mkdtempSync(join(tmpdir(), "contract-"));
  const file = join(dir, "RF-01.yaml");
  writeFileSync(file, proposed.yaml);
  const checked = checkContract(file);
  assert.equal(checked.stage, "rule");
  assert.equal(checked.rule, 1);
  const decision = gate({ contractId: "RF-01", approvalStatus: "draft", critical: [] });
  assert.equal(decision.accepted, false);
  assert.equal(decision.blocks[0].reason, "draft refused");
});

test("a claim with no observation is incomplete, and a closed-field extra is rejected", () => {
  const missing = proposeContract({
    ...request,
    claims: [{ kind: "postcondition", id: "praise", observation: "" }],
  });
  const extra = proposeContract({ ...request, authorization: true });
  assert.equal(missing.yaml, null);
  assert.deepEqual(missing.incomplete, ["praise"]);
  assert.equal(extra.rejected, true);
  assert.equal(extra.field, "authorization");
});

test("precondition, postcondition, and invariant stay outside the schema", () => {
  const fixture = JSON.parse(readFileSync("experiments/claims.json", "utf8"));
  const observed = fixture.claims.filter((claim) => claim.observation);
  const kinds = new Set(observed.map((claim) => claim.kind));
  assert.equal(kinds.has("precondition"), true);
  assert.equal(kinds.has("postcondition"), true);
  assert.equal(kinds.has("invariant"), true);
  const schema = JSON.parse(readFileSync("contracts/contract.envelope.schema.json", "utf8"));
  assert.equal(schema.properties.postcondition, undefined);
  assert.equal(schema.properties.invariant, undefined);
  const proposed = proposeContract({ ...request, claims: fixture.claims });
  assert.equal(proposed.yaml, null);
  assert.deepEqual(proposed.incomplete, ["praise"]);
});
