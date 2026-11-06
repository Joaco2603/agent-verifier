#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import { loadContracts } from "./contracts.mjs";
import { evaluateAll, runCounterexamples } from "./evaluate.mjs";
import { loadFunctions } from "./functions.mjs";

const USAGE = `usage:
  runner run --contracts DIR --functions FILE [--export NAME] [--call object|positional] [--epsilon N] [--json]
  runner counterexamples --contracts DIR --file FILE.json [--epsilon N] [--json]

run             checks the functions against every case and property; exit 1 unless all PASS
counterexamples runs wrong implementations ({id,label,source}) against the contracts;
                exit 1 if any SURVIVES the contract`;

const options = {
  contracts: { type: "string" },
  functions: { type: "string" },
  export: { type: "string" },
  file: { type: "string" },
  call: { type: "string", default: "object" },
  epsilon: { type: "string", default: "0" },
  json: { type: "boolean", default: false },
};

function fail(message) {
  console.error(message);
  process.exit(2);
}

function printRun(results) {
  for (const result of results) {
    const failed = [
      ...result.cases.filter((item) => !item.pass).map((item) => `case ${item.id}`),
      ...result.properties.filter((item) => item.status !== "PASS").map((item) => `property ${item.id} (${item.status})`),
    ];
    console.log(`${result.status.padEnd(7)} ${result.id}${failed.length ? "  " + failed.join(", ") : ""}`);
  }
  const counts = {};
  for (const result of results) counts[result.status] = (counts[result.status] ?? 0) + 1;
  console.log(`\n${Object.entries(counts).map(([key, value]) => `${key} ${value}`).join("  ")}`);
}

function printCounterexamples(results) {
  for (const result of results) {
    const note = result.propertyFieldAbsent ? "  (a property field was not produced)" : "";
    console.log(`${result.verdict.padEnd(10)} ${result.id}${result.label ? " " + result.label : ""}${note}`);
  }
  const survives = results.filter((result) => result.verdict === "SURVIVES").length;
  console.log(`\n${survives} of ${results.length} wrong implementations get through their contract`);
}

async function main() {
  const [command, ...rest] = process.argv.slice(2);
  if (!["run", "counterexamples"].includes(command)) fail(USAGE);
  const { values } = parseArgs({ args: rest, options });
  if (!values.contracts) fail(USAGE);
  if (!["object", "positional"].includes(values.call)) fail("--call must be object or positional");
  const epsilon = Number(values.epsilon);
  if (Number.isNaN(epsilon) || epsilon < 0) fail("--epsilon must be a number of 0 or more");
  const contracts = loadContracts(values.contracts);

  if (command === "run") {
    if (!values.functions) fail(USAGE);
    const functions = await loadFunctions(values.functions, contracts, values.export);
    const results = evaluateAll(contracts, functions, { call: values.call, epsilon });
    if (values.json) console.log(JSON.stringify(results, null, 2));
    else printRun(results);
    process.exit(results.every((result) => result.status === "PASS") ? 0 : 1);
  }

  if (!values.file) fail(USAGE);
  const entries = JSON.parse(readFileSync(values.file, "utf8"));
  if (!Array.isArray(entries)) fail("--file must hold a JSON array of { id, label, source }");
  const results = runCounterexamples(contracts, entries, { epsilon });
  if (values.json) console.log(JSON.stringify(results, null, 2));
  else printCounterexamples(results);
  process.exit(results.some((result) => result.verdict === "SURVIVES") ? 1 : 0);
}

main().catch((error) => fail(error.message));
