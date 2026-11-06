import assert from "node:assert/strict";
import test from "node:test";
import { fixedFns } from "../experiments/agent-fns-fixed.mjs";
import { tasks } from "../experiments/corpus.mjs";
import { measureAgent } from "../src/experiment/agent-run.mjs";

test("the corrected functions pass every approved contract", () => {
  assert.equal(fixedFns.length, tasks.length);
  const measured = measureAgent(tasks, fixedFns, true);
  assert.deepEqual(measured.rows.filter((row) => row.contractFailed).map((row) => row.id), []);
  assert.equal(measured.C, 0);
});

// Inputs beyond the contract's single case, so the functions are not tuned to that case alone.
test("the corrected functions also hold at the boundaries the sentences name", () => {
  const f = (n) => fixedFns[n - 1];
  assert.equal(f(1)({ price: 200, percent: 30 }).total, 140);
  assert.equal(f(1)({ price: 200, percent: 31 }).total, 200);
  assert.equal(f(2)({ balance: 40, amount: 40 }).status, "ACCEPTED");
  assert.equal(f(2)({ balance: 40, amount: 41 }).status, "REJECTED");
  assert.equal(f(3)({ value: 2.5 }).rounded, 3);
  assert.equal(f(3)({ value: 2.2 }).rounded, 2);
  assert.equal(f(4)({ requested: 5 }).attempts, 3);
  assert.equal(f(6)({ own: 3, others: 4 }).visible, 3);
  assert.equal(f(7)({ price: 100 }).fee, 2);
  assert.equal(f(7)({ price: 10 }).fee, 1);
  assert.equal(f(8)({ calendar: 7, weekend: 0 }).days, 7);
  assert.equal(f(9)({ length: 8 }).accepted, true);
  assert.equal(f(9)({ length: 7 }).accepted, false);
  assert.equal(f(10)({ stock: 1, requested: 5 }).sold, 1);
  assert.equal(f(10)({ stock: 5, requested: 2 }).sold, 2);
  assert.equal(f(11)({ first: 5, second: 10 }).discount, 5);
  assert.equal(f(12)({ price: 100, used: 0, total: 4 }).refund, 100);
  assert.equal(f(12)({ price: 100, used: 4, total: 4 }).refund, 0);
  assert.equal(f(14)({ existing: 0 }).status, "ACCEPTED");
  assert.equal(f(14)({ existing: 2 }).status, "REJECTED");
  assert.equal(f(15)({ wait: 500 }).value, "fallback");
  assert.equal(f(15)({ wait: 5 }).value, "payment");
  assert.equal(f(16)({ price: 200, rate: 10 }).total, 220);
  assert.equal(f(17)({ age: 11, fare: 100 }).due, 50);
  assert.equal(f(17)({ age: 12, fare: 100 }).due, 100);
  assert.equal(f(18)({ leader: 3, challenger: 3 }).winner, "leader");
  assert.equal(f(18)({ leader: 3, challenger: 4 }).winner, "challenger");
  assert.equal(f(19)({ qty: -2 }).status, "REJECTED");
  assert.equal(f(19)({ qty: 0 }).status, "ACCEPTED");
  assert.equal(f(20)({ used: 5, limit: 10 }).allowed, true);
  assert.equal(f(20)({ used: 11, limit: 10 }).allowed, false);
});
