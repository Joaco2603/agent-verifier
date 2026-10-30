import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { readFileSync, readdirSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";
import { tasks } from "../experiments/corpus.mjs";
import { checkContract } from "../src/contracts/check.mjs";
import { gitBlob } from "../src/contracts/version.mjs";
import { runSeeded } from "../src/experiment/seeded.mjs";

test("the seeded corpus has 20 tasks and does not authorize a runner", () => {
  assert.equal(tasks.length, 20);
  const measured = runSeeded(tasks);
  assert.equal(measured.rows.every((row) => row.structural), true);
  assert.equal(measured.W, 0);
  assert.equal(measured.C, null);
  assert.equal(measured.F, null);
  assert.equal(measured.M, null);
  assert.equal(measured.runner, false);
  assert.equal(measured.rows.some((row) => row.id === "RF-01" && row.weak === false), true);
});

test("each task is one sentence file and one contract file", () => {
  const names = readdirSync("experiments/tasks");
  const yaml = names.filter((name) => name.endsWith(".yaml")).sort();
  assert.equal(yaml.length, 20);
  for (const name of yaml) {
    const id = name.replace(/\.yaml$/, "");
    const sentence = readFileSync(`experiments/tasks/${id}.txt`, "utf8");
    assert.equal(sentence.includes("approval:"), false);
    assert.equal(sentence.trim().length > 0, true);
    const checked = checkContract(`experiments/tasks/${name}`);
    assert.equal(checked.ok, true, checked.message);
    const bytes = readFileSync(`experiments/tasks/${name}`);
    const git = spawnSync("git", ["hash-object", `experiments/tasks/${name}`], { encoding: "utf8" });
    assert.equal(git.status, 0);
    assert.equal(gitBlob(bytes), git.stdout.trim());
    const task = tasks.find((item) => item.contract.id === id);
    assert.deepEqual(parse(bytes.toString("utf8")), task.contract);
  }
});
