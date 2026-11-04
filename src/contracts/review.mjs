import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv/dist/2020.js";
import { parse, parseDocument } from "yaml";

const root = join(dirname(), "..", "..");

function dirname() {
  return join(__filename_dir(), "src/contracts").replace(join("src/contracts"), "") || process.cwd();
}

const schema = JSON.parse(
  readFileSync(new URL("../../contracts/contract.envelope.schema.json", import.meta.url), "utf8"),
);
const validateSchema = new Ajv({ allErrors: true, allowUnionTypes: true }).compile(schema);

const TASKS_DIR = new URL("../../experiments/tasks/", import.meta.url);

function yamlFiles() {
  return readdirSync(TASKS_DIR, "utf8")
    .filter((name) => name.endsWith(".yaml"))
    .sort();
}

function loadContracts() {
  return yamlFiles().map((name) => {
    const source = readFileSync(new URL(name, TASKS_DIR), "utf8");
    return { name, doc: parseDocument(source), contract: parse(source) };
  });
}

function find(entries, rawId) {
  const id = rawId.toUpperCase();
  const match = entries.find((entry) => entry.contract.id === id);
  if (match) return match;
  const known = entries.map((entry) => entry.contract.id).join(", ");
  process.stderr.write(`unknown task ${rawId}. valid ids: ${known}\n`);
  process.exit(1);
}

function render(entries) {
  const blocks = entries.map(({ contract }) => {
    const lines = [];
    lines.push(`${contract.id} ${contract.name}`);
    lines.push(
      `  approval: ${contract.approval.status} (by ${contract.approval.by}) · priority: ${contract.priority} · gate: ${contract.gate} · revision: ${contract.revision}`,
    );
    lines.push(`  target: ${contract.target.operation}(${contract.target.inputs.join(", ")})`);

    for (const observable of contract.observables) {
      const values = observable.values ? ` [${observable.values.join(" | ")}]` : "";
      lines.push(`  observable: ${observable.name}: ${observable.type}${values}`);
    }

    if (contract.preconditions.length > 0) {
      const text = contract.preconditions
        .map((item) => `${item.field} ${item.operator} ${item.value}`)
        .join("; ");
      lines.push(`  preconditions: ${text}`);
    }

    for (const item of contract.cases) {
      const input = Object.entries(item.input)
        .map(([key, value]) => `${key}=${value}`)
        .join(", ");
      const expected = Object.entries(item.expected)
        .map(([key, value]) => `${key}=${value}`)
        .join(", ");
      lines.push(`  case ${item.id}: ${input} -> ${expected}`);
    }

    for (const item of contract.properties) {
      const max = item.max !== undefined ? `, max=${item.max}` : "";
      lines.push(`  property ${item.id}: ${item.field} >= ${item.min}${max}`);
    }

    for (const item of contract.evidence.minimum) {
      lines.push(`  evidence: ${item.kind} ${item.ref}`);
    }

    for (const limitation of contract.limitations) {
      lines.push(`  limitation: ${limitation}`);
    }

    lines.push(`  review: node src/contracts/review.mjs approve|reject ${contract.id}`);
    return lines.join("\n");
  });
  return `${blocks.join("\n\n")}\n`;
}

function setApproval(id, status, by) {
  const entries = loadContracts();
  const entry = find(entries, id);

  const doc = entry.doc;
  const next = { status, by };
  if (by !== undefined) {
    doc.setIn(["approval", "status"], status);
    doc.setIn(["approval", "by"], by);
  } else {
    doc.setIn(["approval", "status"], status);
    next.by = doc.getIn(["approval", "by"]);
  }

  const preview = parse(doc.toString());
  if (!validateSchema(preview)) {
    const error = validateSchema.errors[0];
    process.stderr.write(
      `aborted, edit would be invalid: ${error.instancePath || "(root)"} ${error.message} (file untouched)\n`,
    );
    process.exit(1);
  }

  writeFileSync(new URL(entry.name, TASKS_DIR), doc.toString());
  process.stdout.write(`${entry.contract.id}: approval -> ${status} (by ${next.by})\n`);
}

function main() {
  const [, , command = "list", ...args] = process.argv;
  if (command === "list") {
    process.stdout.write(render(loadContracts()));
    return;
  }
  if (command === "approve") {
    const [id, by = "experimenter"] = args;
    if (!id) return usage();
    return setApproval(id, "approved", by);
  }
  if (command === "reject") {
    const [id] = args;
    if (!id) return usage();
    return setApproval(id, "draft", "unapproved");
  }
  usage();
}

function usage() {
  process.stdout.write(
    "usage: node src/contracts/review.mjs [list | approve <id> [by] | reject <id>]\n",
  );
  process.exit(1);
}

main();
