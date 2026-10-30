import assert from "node:assert/strict";
import test from "node:test";
import { parseSave, parseSearch } from "../src/memory/engram.mjs";
import { MemoryError } from "../src/memory/port.mjs";
import { openMemory } from "../src/memory/open.mjs";

const savedStdout = 'Memory saved: #7 "contracts" (decision)\n';
const searchStdout = `Found 1 memories:

[1] #7 (decision) — contracts
    schema and rule 7 landed
    2026-10-28 14:23:27 | project: ai-skill-reviewer | scope: project
`;

test("engram save and search use one command shape", () => {
  const calls = [];
  const memory = openMemory(
    { MEMORY_BACKEND: "engram", MEMORY_PROJECT: "ai-skill-reviewer" },
    {
      engram: {
        run(args) {
          calls.push(args);
          const stdout = args[0] === "save" ? savedStdout : searchStdout;
          return { status: 0, stdout, stderr: "" };
        },
      },
    },
  );
  assert.deepEqual(memory.save({ title: "contracts", body: "schema and rule 7 landed" }), {
    id: "7",
    title: "contracts",
    type: "decision",
  });
  assert.deepEqual(memory.search("contracts"), [
    {
      id: "7",
      type: "decision",
      title: "contracts",
      body: "schema and rule 7 landed",
      project: "ai-skill-reviewer",
    },
  ]);
  assert.deepEqual(calls[0].slice(0, 3), ["save", "contracts", "schema and rule 7 landed"]);
  assert.ok(calls[0].includes("--project"));
  assert.equal(parseSave(savedStdout), "7");
  assert.equal(parseSearch("Found 0 memories:\n").length, 0);
});

test("a failed engram command is an error", () => {
  const memory = openMemory(
    {},
    { engram: { run: () => ({ status: 1, stdout: "", stderr: "database closed" }) } },
  );
  assert.throws(() => memory.save({ title: "t", body: "b" }), MemoryError);
});

test("hindsight stays closed until retain and recall exist", () => {
  const closed = openMemory({ MEMORY_BACKEND: "hindsight" });
  assert.throws(() => closed.save({ title: "t", body: "b" }), /not connected/);
  const retained = [];
  const open = openMemory(
    { MEMORY_BACKEND: "hindsight" },
    {
      hindsight: {
        retain(record) {
          retained.push(record);
          return { id: "h1", ...record };
        },
        recall() {
          return retained;
        },
      },
    },
  );
  open.save({ title: "t", body: "b" });
  assert.equal(open.search("t")[0].title, "t");
});

test("an unknown backend is refused", () => {
  assert.throws(() => openMemory({ MEMORY_BACKEND: "notes" }), /Unknown memory backend/);
});
