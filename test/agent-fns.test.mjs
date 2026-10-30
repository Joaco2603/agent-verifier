import assert from "node:assert/strict";
import test from "node:test";
import { fns } from "../experiments/agent-fns.mjs";

test("allows discounts up to 30 percent", () => {
  assert.deepEqual(fns[0]({ price: 200, percent: 30 }), { allowed: true, price: 140 });
  assert.deepEqual(fns[0]({ price: 200, percent: 31 }), { allowed: false });
});

test("rejects a transfer above the balance", () => {
  assert.deepEqual(fns[1]({ balance: 40, amount: 40 }), { accepted: true, balance: 0 });
  assert.deepEqual(fns[1]({ balance: 40, amount: 41 }), { accepted: false, balance: 40 });
});

test("rounds halves up", () => {
  assert.deepEqual(fns[2]({ value: 1.5 }), { value: 2 });
  assert.deepEqual(fns[2]({ value: 1.4 }), { value: 1 });
  assert.deepEqual(fns[2]({ value: -1.5 }), { value: -1 });
});

test("retries at most 3 times", () => {
  assert.deepEqual(fns[3]({ attempt: 3 }), { proceed: true });
  assert.deepEqual(fns[3]({ attempt: 4 }), { proceed: false });
});

test("returns no rows when nothing matches", () => {
  const rows = [{ id: 1, kind: "a" }];
  assert.deepEqual(fns[4]({ rows, field: "kind", value: "z" }), { rows: [] });
  assert.deepEqual(fns[4]({ rows, field: "kind", value: "a" }), { rows });
});

test("users see their own orders", () => {
  const orders = [
    { id: 1, userId: "ada" },
    { id: 2, userId: "bea" },
  ];
  assert.deepEqual(fns[5]({ userId: "ada", orders }), { orders: [{ id: 1, userId: "ada" }] });
});

test("charges 2 percent with a minimum of 1", () => {
  assert.deepEqual(fns[6]({ amount: 10 }), { charge: 1 });
  assert.deepEqual(fns[6]({ amount: 250 }), { charge: 5 });
});

test("counts only business days", () => {
  assert.deepEqual(fns[7]({ start: "2026-10-23", end: "2026-10-26" }), { days: 2 });
});

test("requires passwords of at least 8 characters", () => {
  assert.deepEqual(fns[8]({ password: "short" }), { valid: false });
  assert.deepEqual(fns[8]({ password: "longpass" }), { valid: true });
});

test("does not sell more than stock on hand", () => {
  assert.deepEqual(fns[9]({ stock: 4, quantity: 4 }), { accepted: true, stock: 0 });
  assert.deepEqual(fns[9]({ stock: 4, quantity: 5 }), { accepted: false, stock: 4 });
});

test("applies the first matching coupon", () => {
  const coupons = [
    { code: "NO", off: 5, match: false },
    { code: "YES", off: 8, match: true },
    { code: "LATER", off: 20, match: true },
  ];
  assert.deepEqual(fns[10]({ price: 50, coupons }), { price: 42, code: "YES" });
});

test("refunds only unused days", () => {
  assert.deepEqual(fns[11]({ dailyRate: 10, totalDays: 5, usedDays: 2 }), { refund: 30 });
});

test("keeps rows in name order", () => {
  assert.deepEqual(fns[12]({ rows: [{ name: "cara" }, { name: "ada" }, { name: "bea" }] }), {
    rows: [{ name: "ada" }, { name: "bea" }, { name: "cara" }],
  });
});

test("rejects a duplicate email", () => {
  assert.deepEqual(fns[13]({ emails: ["a@b.co"], email: "a@b.co" }), { accepted: false });
  assert.deepEqual(fns[13]({ emails: ["a@b.co"], email: "c@d.co" }), {
    accepted: true,
    emails: ["a@b.co", "c@d.co"],
  });
});

test("returns the fallback on timeout", () => {
  assert.deepEqual(fns[14]({ timedOut: true, value: "live", fallback: "cached" }), { value: "cached" });
  assert.deepEqual(fns[14]({ timedOut: false, value: "live", fallback: "cached" }), { value: "live" });
});

test("shows the total with tax included", () => {
  assert.deepEqual(fns[15]({ subtotal: 80, tax: 8 }), { total: 88 });
});

test("children under 12 pay half", () => {
  assert.deepEqual(fns[16]({ age: 11, price: 40 }), { price: 20 });
  assert.deepEqual(fns[16]({ age: 12, price: 40 }), { price: 40 });
});

test("a tie keeps the current leader", () => {
  assert.deepEqual(fns[17]({ leader: "ada", challenger: "bea", leaderScore: 5, challengerScore: 5 }), {
    leader: "ada",
  });
  assert.deepEqual(fns[17]({ leader: "ada", challenger: "bea", leaderScore: 5, challengerScore: 6 }), {
    leader: "bea",
  });
});

test("rejects a negative quantity", () => {
  assert.deepEqual(fns[18]({ quantity: -1 }), { accepted: false });
  assert.deepEqual(fns[18]({ quantity: 0 }), { accepted: true, quantity: 0 });
});

test("treats the daily limit as inclusive", () => {
  assert.deepEqual(fns[19]({ spent: 100, limit: 100 }), { allowed: true });
  assert.deepEqual(fns[19]({ spent: 101, limit: 100 }), { allowed: false });
});
