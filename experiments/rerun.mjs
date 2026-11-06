#!/usr/bin/env node
// Repeats the whole measurement on the current corpus, from the files on disk:
// task files -> contracts -> seeded defects (W) -> original and corrected functions (C)
// -> counterexamples -> reviewer baseline. Writes docs/experiment/baseline-updated-corpus.json.
// Usage: node experiments/rerun.mjs [--out FILE]
import { readFileSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { loadContracts } from "../src/runner/contracts.mjs";
import { evaluateAll, runCounterexamples } from "../src/runner/evaluate.mjs";
import { mapFunctions } from "../src/runner/functions.mjs";
import { judgeCorpus, measureAgent } from "../src/experiment/agent-run.mjs";
import { runSeeded } from "../src/experiment/seeded.mjs";
import { tasks } from "./corpus.mjs";
import { fns } from "./agent-fns.mjs";
import { fixedFns } from "./agent-fns-fixed.mjs";

const REPEATS = 5;
const out = process.argv.includes("--out")
  ? process.argv[process.argv.indexOf("--out") + 1]
  : "docs/experiment/baseline-updated-corpus.json";

function median(values) {
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

// Runs `step` REPEATS times and reports the median wall clock in milliseconds.
function timed(step) {
  const times = [];
  let result;
  for (let i = 0; i < REPEATS; i += 1) {
    const start = performance.now();
    result = step();
    times.push(performance.now() - start);
  }
  return { result, ms: Number(median(times).toFixed(2)) };
}

const contracts = loadContracts("experiments/tasks");
const reviewers = JSON.parse(readFileSync("docs/experiment/baseline-rubric.json", "utf8"));
const entries = reviewers.rows.flatMap((row) =>
  ["a", "b"].filter((key) => row[key]?.counterexample).map((key) => ({ id: row.id, label: key, source: row[key].counterexample })),
);

const seeded = timed(() => runSeeded(tasks));
const original = timed(() => measureAgent(tasks, fns, true));
const corrected = timed(() => measureAgent(tasks, fixedFns, true));
const runnerFixed = timed(() => evaluateAll(contracts, mapFunctions(fixedFns, contracts)));
const survivors = timed(() => runCounterexamples(contracts, entries));
const judgedOriginal = judgeCorpus(tasks, fns, true);
const judgedFixed = judgeCorpus(tasks, fixedFns, true);

const report = {
  label: "rerun on the current corpus",
  manualReview: false,
  corpus: { tasks: tasks.length, contractFiles: contracts.length, revisions: Object.fromEntries(contracts.map((c) => [c.id, c.revision ?? 1])) },
  weakContracts: {
    W: seeded.result.W,
    ids: seeded.result.rows.filter((row) => row.weak === true).map((row) => row.id),
    limit: seeded.result.limitation,
    byReviewerCounterexamples: {
      W: new Set(survivors.result.filter((row) => row.verdict === "SURVIVES").map((row) => row.id)).size,
      ids: [...new Set(survivors.result.filter((row) => row.verdict === "SURVIVES").map((row) => row.id))],
      note: "A contract is weak here when a subagent reviewer wrote a wrong implementation that passes it. The Module A limit is at most 3.",
    },
  },
  agentCatches: {
    original: { C: original.result.C, needsHuman: original.result.needsHuman.length },
    corrected: { C: corrected.result.C, needsHuman: corrected.result.needsHuman.length },
  },
  runner: {
    correctedFunctions: runnerFixed.result.reduce((counts, row) => ({ ...counts, [row.status]: (counts[row.status] ?? 0) + 1 }), {}),
    counterexamples: {
      total: survivors.result.length,
      survive: survivors.result.filter((row) => row.verdict === "SURVIVES").length,
      caught: survivors.result.filter((row) => row.verdict === "CAUGHT").length,
    },
  },
  reviewers: {
    kind: "subagent",
    agreement: reviewers.agreement,
    approvedByBoth: reviewers.approvedByBoth,
    medianSeconds: reviewers.medianSeconds,
    note: "From docs/experiment/baseline-rubric.json. Subagent time is not human approval time.",
  },
  benchmark: {
    original: { runner: judgedOriginal.runner, cost: judgedOriginal.cost },
    corrected: { runner: judgedFixed.runner, cost: judgedFixed.cost },
  },
  verificationMilliseconds: {
    method: `median of ${REPEATS} runs, wall clock, this machine`,
    seededDefects: seeded.ms,
    originalFunctionsAgainstContracts: original.ms,
    correctedFunctionsAgainstContracts: corrected.ms,
    runnerOnCorrectedFunctions: runnerFixed.ms,
    counterexamples: survivors.ms,
  },
  gaps: [
    "Price: no model was called in these runs, so price stays unknown, not zero.",
    "Escape and false alarm: no later observation and no person has judged them.",
    "Approval minutes: PERT estimates and subagent times only; no person was timed.",
  ],
};

writeFileSync(out, JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ out, W: report.weakContracts.W, agentCatches: report.agentCatches, runner: report.runner, build: report.benchmark.corrected.runner.build, ms: report.verificationMilliseconds }, null, 1));
