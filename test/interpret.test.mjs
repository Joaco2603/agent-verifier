import assert from "node:assert/strict";
import test from "node:test";
import { canApprove, interpret } from "../src/interpret/defects.mjs";

test("ambiguity, contradiction, and incomplete drafts are reported and cannot be approved", () => {
  const ambiguity = interpret({
    id: "RF-02",
    name: "discount",
    cases: [
      { id: "a", input: { amount: 1 }, expected: { status: "A" } },
      { id: "b", input: { amount: 1 }, expected: { status: "B" } },
    ],
    observables: [{ name: "status" }],
    limitations: ["two readings"],
  });
  const contradiction = interpret({
    id: "RF-03",
    name: "bounds",
    cases: [{ id: "bad", input: { amount: -50 }, expected: { status: "REJECTED" } }],
    observables: [{ name: "status" }],
    limitations: ["negative amount"],
    preconditions: [{ field: "amount", operator: "gt", value: 0 }],
  });
  const incomplete = interpret({ id: "RF-04", cases: [{ id: "bare", expected: {} }] });
  assert.equal(ambiguity.defects.some((item) => item.kind === "ambiguity" && item.id === "RF-02"), true);
  assert.equal(contradiction.defects.some((item) => item.kind === "contradiction"), true);
  assert.equal(incomplete.defects.some((item) => item.kind === "incomplete"), true);
  assert.equal(canApprove(ambiguity), false);
  assert.equal(canApprove(contradiction), false);
  assert.equal(canApprove(incomplete), false);
});

test("a model proposal stays outside approval", () => {
  const result = interpret({ id: "RF-05", name: "n", cases: [], observables: [], limitations: ["x"] }, { text: "looks fine" });
  assert.deepEqual(result.proposal, { text: "looks fine" });
  assert.equal(result.approval.status, "draft");
  assert.equal(canApprove({ defects: [], approval: { status: "approved" } }), true);
});
