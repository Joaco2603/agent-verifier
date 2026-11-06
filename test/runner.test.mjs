import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { loadContracts } from "../src/runner/contracts.mjs";
import { evaluateAll, evaluateContract, functionFromSource, runCounterexamples } from "../src/runner/evaluate.mjs";
import { mapFunctions } from "../src/runner/functions.mjs";

// A small project that has nothing to do with the RF corpus: a shipping fee with a free tier.
const FEE = {
  id: "FEE-01",
  target: { operation: "fee", inputs: ["weight", "express"] },
  cases: [
    { id: "light", input: { weight: 1, express: false }, expected: { fee: 5 } },
    { id: "heavy", input: { weight: 20, express: true }, expected: { fee: 30 } },
  ],
  properties: [{ id: "floor", template: "bounded_output", field: "fee", min: 0, max: 100 }],
};
const fee = ({ weight, express }) => ({ fee: (weight > 10 ? 20 : 5) + (express ? 10 : 0) });

test("a function that meets every case and property passes", () => {
  const result = evaluateContract(FEE, fee);
  assert.equal(result.status, "PASS");
  assert.deepEqual(result.cases.map((item) => item.pass), [true, true]);
});

test("a wrong case result fails and names the field", () => {
  const result = evaluateContract(FEE, () => ({ fee: 7 }));
  assert.equal(result.status, "FAIL");
  assert.deepEqual(result.cases[0].misses, [{ field: "fee", want: 5, got: 7 }]);
});

test("a property is checked on every case, not only the first", () => {
  const limited = { ...FEE, cases: [FEE.cases[0], { ...FEE.cases[1], expected: { fee: 999 } }] };
  const fn = ({ weight }) => ({ fee: weight > 10 ? 999 : 5 });
  const result = evaluateContract(limited, fn);
  assert.equal(result.properties[0].status, "FAIL");
  assert.equal(result.properties[0].violations[0].case, "heavy");
});

test("a property field that is not produced fails unless strictFields is off", () => {
  const withSeen = { ...FEE, properties: [{ id: "seen", template: "bounded_output", field: "seen", min: 0 }] };
  assert.equal(evaluateContract(withSeen, fee).status, "FAIL");
  const lenient = evaluateContract(withSeen, fee, { strictFields: false });
  assert.equal(lenient.status, "PASS");
  assert.equal(lenient.properties[0].absent, true);
});

test("a property template the runner cannot check is UNKNOWN, never PASS", () => {
  const odd = { ...FEE, properties: [{ id: "p", template: "monotonic", field: "fee", min: 0 }] };
  assert.equal(evaluateContract(odd, fee).status, "UNKNOWN");
});

test("a function that throws fails the case with the message", () => {
  const result = evaluateContract(FEE, () => {
    throw new Error("boom");
  });
  assert.equal(result.status, "FAIL");
  assert.equal(result.cases[0].error, "boom");
});

test("positional calls follow target.inputs", () => {
  const result = evaluateContract(FEE, (weight, express) => fee({ weight, express }), { call: "positional" });
  assert.equal(result.status, "PASS");
});

test("a bare result counts only when wrapBare is on", () => {
  const bare = ({ weight, express }) => fee({ weight, express }).fee;
  assert.equal(evaluateContract(FEE, bare).status, "FAIL");
  assert.equal(evaluateContract(FEE, bare, { wrapBare: true }).status, "PASS");
});

test("epsilon absorbs float noise and defaults to exact", () => {
  const contract = { ...FEE, cases: [{ id: "c", input: { weight: 1, express: false }, expected: { fee: 0.3 } }], properties: [] };
  const noisy = () => ({ fee: 0.1 + 0.2 });
  assert.equal(evaluateContract(contract, noisy).status, "FAIL");
  assert.equal(evaluateContract(contract, noisy, { epsilon: 1e-9 }).status, "PASS");
});

test("functions map by id or by position, and a missing one is reported", () => {
  const other = { ...FEE, id: "FEE-02" };
  const byId = mapFunctions({ "FEE-01": fee }, [FEE, other]);
  assert.deepEqual(evaluateAll([FEE, other], byId).map((item) => item.status), ["PASS", "MISSING"]);
  const byPosition = mapFunctions([fee, fee], [FEE, other]);
  assert.deepEqual(evaluateAll([FEE, other], byPosition).map((item) => item.status), ["PASS", "PASS"]);
  assert.throws(() => mapFunctions([fee], [FEE, other]), /1 functions for 2 contracts/);
});

test("counterexamples are CAUGHT when a case rejects them and SURVIVE when none does", () => {
  const entries = [
    { id: "FEE-01", label: "ignores weight", source: "function f({weight, express}) { return { fee: express ? 15 : 5 }; }" },
    { id: "FEE-01", label: "positional", source: "function f(weight, express) { return { fee: (weight > 10 ? 20 : 5) + (express ? 10 : 0) + 1 }; }" },
  ];
  const [ignoresWeight, shifted] = runCounterexamples([FEE], entries);
  assert.equal(ignoresWeight.verdict, "CAUGHT");
  assert.equal(shifted.verdict, "CAUGHT");
  const thin = { ...FEE, cases: [FEE.cases[0]] };
  const [survivor] = runCounterexamples([thin], [{ id: "FEE-01", source: "function f() { return { fee: 5 }; }" }]);
  assert.equal(survivor.verdict, "SURVIVES");
  assert.equal(runCounterexamples([FEE], [{ id: "NOPE", source: "()=>1" }])[0].verdict, "NO_CONTRACT");
  assert.equal(runCounterexamples([FEE], [{ id: "FEE-01", source: "function (" }])[0].verdict, "UNPARSEABLE");
});

test("functionFromSource reads object and positional signatures", () => {
  assert.deepEqual(functionFromSource("function f({weight}) { return { w: weight }; }", FEE)({ weight: 3, express: true }), { w: 3 });
  assert.deepEqual(functionFromSource("(weight, express) => ({ w: weight, e: express })", FEE)({ weight: 3, express: true }), { w: 3, e: true });
});

test("the command line loads a folder and a module and sets the exit code", () => {
  const dir = mkdtempSync(join(tmpdir(), "runner-"));
  writeFileSync(join(dir, "FEE-01.yaml"), "id: FEE-01\ntarget:\n  operation: fee\n  inputs: [weight, express]\ncases:\n  - id: light\n    input: { weight: 1, express: false }\n    expected: { fee: 5 }\nproperties: []\n");
  writeFileSync(join(dir, "good.mjs"), "export const functions = { 'FEE-01': ({ weight }) => ({ fee: weight > 10 ? 20 : 5 }) };\n");
  writeFileSync(join(dir, "bad.mjs"), "export const functions = { 'FEE-01': () => ({ fee: 6 }) };\n");
  writeFileSync(join(dir, "ce.json"), JSON.stringify([{ id: "FEE-01", source: "function f() { return { fee: 5 }; }" }]));
  const run = (args) => spawnSync(process.execPath, ["src/runner/cli.mjs", ...args], { encoding: "utf8" });
  assert.equal(run(["run", "--contracts", dir, "--functions", join(dir, "good.mjs")]).status, 0);
  const bad = run(["run", "--contracts", dir, "--functions", join(dir, "bad.mjs")]);
  assert.equal(bad.status, 1);
  assert.match(bad.stdout, /FAIL\s+FEE-01/);
  assert.equal(run(["counterexamples", "--contracts", dir, "--file", join(dir, "ce.json")]).status, 1);
  assert.equal(run([]).status, 2);
  assert.deepEqual(loadContracts(dir).map((contract) => contract.id), ["FEE-01"]);
});
