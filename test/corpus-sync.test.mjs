import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { buildCorpusSource, readCorpusInputs } from "../experiments/build-corpus.mjs";

test("experiments/corpus.mjs is regenerated from the task files", async () => {
  const generated = buildCorpusSource(await readCorpusInputs());
  const onDisk = readFileSync("experiments/corpus.mjs", "utf8");
  assert.equal(
    onDisk,
    generated,
    "experiments/corpus.mjs is stale - run `npm run build:corpus` and commit the regenerated file",
  );
});

test("the builder output is deterministic for the same inputs", async () => {
  const inputs = await readCorpusInputs();
  assert.equal(buildCorpusSource(inputs), buildCorpusSource(inputs));
  assert.equal(inputs.entries.length > 0, true);
  const ids = inputs.entries.map((entry) => entry.id);
  assert.deepEqual(ids, [...ids].sort());
});
