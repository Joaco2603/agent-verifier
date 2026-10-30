import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv from "ajv/dist/2020.js";
import { parse } from "yaml";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const schema = JSON.parse(
  readFileSync(join(root, "contracts/contract.envelope.schema.json"), "utf8"),
);
const validate = new Ajv({ allErrors: true, allowUnionTypes: true }).compile(schema);

const compare = {
  gt: (actual, bound) => actual > bound,
  gte: (actual, bound) => actual >= bound,
  lt: (actual, bound) => actual < bound,
  lte: (actual, bound) => actual <= bound,
  eq: (actual, bound) => actual === bound,
};

function rule(number, message) {
  return { ok: false, stage: "rule", rule: number, message };
}

function structural(contract) {
  if (contract.approval.status !== "approved") {
    return rule(1, "approval.status must be approved");
  }

  const caseIds = new Set(contract.cases.map((item) => item.id));
  const propertyIds = new Set(contract.properties.map((item) => item.id));
  for (const item of contract.evidence.minimum) {
    const ids = item.kind === "example_case" ? caseIds : propertyIds;
    if (!ids.has(item.ref)) {
      return rule(2, `evidence ref ${item.ref} is not a ${item.kind}`);
    }
  }

  const inputs = new Set(contract.target.inputs);
  for (const item of contract.preconditions) {
    if (!inputs.has(item.field)) {
      return rule(3, `precondition field ${item.field} is not an input`);
    }
  }

  for (const item of contract.cases) {
    for (const key of Object.keys(item.input)) {
      if (!inputs.has(key)) return rule(4, `case input ${key} is not an input`);
    }
  }

  const observables = new Map(contract.observables.map((item) => [item.name, item]));
  for (const item of contract.cases) {
    for (const key of Object.keys(item.expected)) {
      if (!observables.has(key)) return rule(5, `expected ${key} is not an observable`);
    }
  }
  for (const item of contract.properties) {
    if (!observables.has(item.field)) {
      return rule(5, `property field ${item.field} is not an observable`);
    }
  }

  for (const item of contract.cases) {
    for (const [key, value] of Object.entries(item.expected)) {
      const observable = observables.get(key);
      if (typeof value === "string" && observable.values && !observable.values.includes(value)) {
        return rule(6, `expected ${key} value ${value} is not allowed`);
      }
    }
  }

  for (const item of contract.cases) {
    for (const precondition of contract.preconditions) {
      const actual = item.input[precondition.field];
      const holds = typeof actual === "number" && compare[precondition.operator](actual, precondition.value);
      if (!holds) {
        return rule(
          7,
          `case ${item.id} input ${precondition.field} does not satisfy ${precondition.operator} ${precondition.value}`,
        );
      }
    }
  }

  for (const item of contract.properties) {
    if (item.max !== undefined && item.min > item.max) {
      return rule(8, `bounded_output ${item.id} min is greater than max`);
    }
  }

  if (contract.priority === "critical") {
    const bounded = new Set(contract.properties.map((item) => item.field));
    const hasOutcome = contract.cases.some((item) =>
      Object.keys(item.expected).some((key) => !bounded.has(key)),
    );
    if (!hasOutcome) {
      return rule(9, "critical contract expected keys are only bounded_output fields");
    }
  }

  return { ok: true };
}

export function checkContract(file) {
  const contract = parse(readFileSync(file, "utf8"));
  if (!validate(contract)) {
    const err = validate.errors[0];
    const where = err.instancePath || "(root)";
    return { ok: false, stage: "schema", message: `${where} ${err.message}` };
  }
  return structural(contract);
}
