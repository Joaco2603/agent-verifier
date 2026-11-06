#!/usr/bin/env node
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parseArgs } from "node:util";
import { loadContracts } from "../runner/contracts.mjs";
import { evaluateAll } from "../runner/evaluate.mjs";
import { loadFunctions } from "../runner/functions.mjs";
import { alarm, done, readLog, report, start } from "./ledger.mjs";

const USAGE = `usage:
  review start ID --by NAME --kind human|claude|subagent
  review done ID --verdict approve|reject [--note TEXT]
  review queue --contracts DIR --functions FILE [--export NAME] [--sentences DIR]
  review alarm ID --by NAME --kind KIND --judgement defect|false_alarm|unclear --note TEXT
  review report --contracts DIR [--functions FILE --export NAME]

All commands take --log FILE (default docs/experiment/review-log.jsonl).
start and done time the review by the clock. alarm records a reviewer's reading of one FAIL.
queue lists the FAILs a reviewer must read. report prints times and alarms per reviewer kind.`;

const options = {
  log: { type: "string", default: "docs/experiment/review-log.jsonl" },
  by: { type: "string" },
  kind: { type: "string" },
  verdict: { type: "string" },
  judgement: { type: "string" },
  note: { type: "string" },
  contracts: { type: "string" },
  functions: { type: "string" },
  export: { type: "string" },
  sentences: { type: "string" },
};

function fail(message) {
  console.error(message);
  process.exit(2);
}

async function failingIds(contracts, values) {
  if (!values.functions) return null;
  const functions = await loadFunctions(values.functions, contracts, values.export);
  return { results: evaluateAll(contracts, functions), contracts };
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  const { values, positionals } = parseArgs({ args: rest, options, allowPositionals: true });
  const id = positionals[0];
  try {
    if (command === "start" && id) {
      start(values.log, { id, by: values.by, kind: values.kind });
      console.log(`${id}: timer started for ${values.by} (${values.kind})`);
    } else if (command === "done" && id) {
      const entry = done(values.log, { id, verdict: values.verdict, note: values.note });
      console.log(`${id}: ${entry.verdict} after ${entry.minutes.toFixed(2)} minutes by ${entry.by} (${entry.kind})`);
    } else if (command === "alarm" && id) {
      const entry = alarm(values.log, { id, by: values.by, kind: values.kind, judgement: values.judgement, note: values.note });
      console.log(`${id}: FAIL judged ${entry.judgement} by ${entry.by} (${entry.kind})`);
    } else if (command === "queue") {
      if (!values.contracts || !values.functions) fail(USAGE);
      const contracts = loadContracts(values.contracts);
      const { results } = await failingIds(contracts, values);
      for (const result of results.filter((row) => row.status === "FAIL")) {
        const contract = contracts.find((item) => item.id === result.id);
        const sentenceFile = values.sentences && join(values.sentences, `${result.id}.txt`);
        const sentence = sentenceFile && existsSync(sentenceFile) ? readFileSync(sentenceFile, "utf8").trim() : null;
        console.log(`${result.id}${sentence ? ` — ${sentence}` : ""}`);
        for (const item of result.cases.filter((row) => !row.pass)) {
          const given = JSON.stringify(contract.cases.find((row) => row.id === item.id).input);
          const detail = item.error ? `threw ${item.error}` : item.misses.map((m) => `${m.field}: wanted ${JSON.stringify(m.want)}, got ${JSON.stringify(m.got)}`).join("; ");
          console.log(`  case ${item.id} ${given}: ${detail}`);
        }
      }
    } else if (command === "report") {
      if (!values.contracts) fail(USAGE);
      const contracts = loadContracts(values.contracts);
      const ids = contracts.map((contract) => contract.id);
      const evaluated = await failingIds(contracts, values);
      const failIds = evaluated ? evaluated.results.filter((row) => row.status === "FAIL").map((row) => row.id) : null;
      console.log(JSON.stringify(report(readLog(values.log), ids, failIds), null, 2));
    } else {
      fail(USAGE);
    }
  } catch (error) {
    fail(error.message);
  }
}

main();
