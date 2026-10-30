import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { parse, stringify } from "yaml";
import { checkContract } from "../src/contracts/check.mjs";
import { contractsChanged } from "../src/contracts/protect.mjs";

const rf01Path = fileURLToPath(new URL("../contracts/RF-01.yaml", import.meta.url));
const cliPath = fileURLToPath(new URL("../src/contracts/cli.mjs", import.meta.url));
const rf01 = parse(readFileSync(rf01Path, "utf8"));

function writeVariant(mutate) {
  const doc = structuredClone(rf01);
  mutate(doc);
  const dir = mkdtempSync(join(tmpdir(), "contract-"));
  const file = join(dir, "contract.yaml");
  writeFileSync(file, stringify(doc));
  return {
    file,
    cleanup() {
      rmSync(dir, { recursive: true, force: true });
    },
  };
}

test("RF-01 passes schema and rules", () => {
  assert.deepEqual(checkContract(rf01Path), { ok: true });
  const run = spawnSync(process.execPath, [cliPath, rf01Path], { encoding: "utf8" });
  assert.equal(run.status, 0);
  assert.deepEqual(JSON.parse(run.stdout), { ok: true });
});

test("gate report fails schema validation", (t) => {
  const variant = writeVariant((doc) => {
    doc.gate = "report";
  });
  t.after(variant.cleanup);
  const result = checkContract(variant.file);
  assert.equal(result.ok, false);
  assert.equal(result.stage, "schema");
  assert.equal(result.rule, undefined);
});

test("amount -50 fails rule 7", (t) => {
  const variant = writeVariant((doc) => {
    doc.cases[0].input.amount = -50;
  });
  t.after(variant.cleanup);
  const result = checkContract(variant.file);
  assert.equal(result.ok, false);
  assert.equal(result.stage, "rule");
  assert.equal(result.rule, 7);
});

test("critical balance_after bound alone fails rule 9", (t) => {
  const variant = writeVariant((doc) => {
    doc.observables = [{ name: "balance_after", type: "number" }];
    doc.cases[0].expected = { balance_after: 0 };
    doc.evidence.minimum = [{ kind: "property", ref: "no-negative-balance" }];
  });
  t.after(variant.cleanup);
  const result = checkContract(variant.file);
  assert.equal(result.ok, false);
  assert.equal(result.stage, "rule");
  assert.equal(result.rule, 9);
});

test("contractsChanged sees contracts/ and ignores src/", () => {
  const edited = `diff --git a/contracts/RF-01.yaml b/contracts/RF-01.yaml
index 1111111..2222222 100644
--- a/contracts/RF-01.yaml
+++ b/contracts/RF-01.yaml
@@ -4,1 +4,1 @@
-gate: block
+gate: report
`;
  const added = `diff --git a/contracts/RF-02.yaml b/contracts/RF-02.yaml
new file mode 100644
--- /dev/null
+++ b/contracts/RF-02.yaml
@@ -0,0 +1 @@
+id: RF-02
`;
  const removed = `diff --git a/contracts/RF-01.yaml b/contracts/RF-01.yaml
deleted file mode 100644
--- a/contracts/RF-01.yaml
+++ /dev/null
@@ -1 +0,0 @@
-id: RF-01
`;
  const source = `diff --git a/src/foo.js b/src/foo.js
index 1111111..2222222 100644
--- a/src/foo.js
+++ b/src/foo.js
@@ -1 +1 @@
-const a = 1;
+const a = 2;
`;
  assert.equal(contractsChanged(edited), true);
  assert.equal(contractsChanged(added), true);
  assert.equal(contractsChanged(removed), true);
  assert.equal(contractsChanged(source), false);
});

test("removing limitations fails schema validation", (t) => {
  const variant = writeVariant((doc) => {
    delete doc.limitations;
  });
  t.after(variant.cleanup);
  const result = checkContract(variant.file);
  assert.equal(result.ok, false);
  assert.equal(result.stage, "schema");
});

test("a missing evidence case fails rule 2", (t) => {
  const variant = writeVariant((doc) => {
    doc.evidence.minimum[0].ref = "missing-case";
  });
  t.after(variant.cleanup);
  const result = checkContract(variant.file);
  assert.equal(result.ok, false);
  assert.equal(result.stage, "rule");
  assert.equal(result.rule, 2);
});

test("rules 3, 4, 5, 6, and 8 each stop on their own defect", (t) => {
  const cases = [
    [(doc) => {
      doc.preconditions[0].field = "nope";
    }, 3],
    [(doc) => {
      doc.cases[0].input.extra = 1;
    }, 4],
    [(doc) => {
      doc.cases[0].expected.nope = 1;
    }, 5],
    [(doc) => {
      doc.cases[0].expected.status = "MAYBE";
    }, 6],
    [(doc) => {
      doc.properties[0].max = -1;
    }, 8],
  ];
  for (const [mutate, rule] of cases) {
    const variant = writeVariant(mutate);
    t.after(variant.cleanup);
    const result = checkContract(variant.file);
    assert.equal(result.ok, false);
    assert.equal(result.stage, "rule");
    assert.equal(result.rule, rule);
  }
});
