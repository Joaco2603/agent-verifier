const isRecord = (value) => value !== null && typeof value === "object" && !Array.isArray(value);

function same(actual, expected, epsilon) {
  if (typeof actual === "number" && typeof expected === "number") return Math.abs(actual - expected) <= epsilon;
  return actual === expected;
}

// Calls the function with the case input. "object" passes the input record as is;
// "positional" passes the values in the order the contract declares in target.inputs.
export function invoke(fn, contract, input, call = "object") {
  if (call === "positional") return fn(...contract.target.inputs.map((name) => input[name]));
  return fn(input);
}

// A function may return a record. A bare value is wrapped under the first expected key only
// when wrapBare is on; otherwise it counts as an empty result.
function observed(output, expected, wrapBare) {
  if (isRecord(output)) return output;
  if (wrapBare && output !== undefined) return { [Object.keys(expected)[0]]: output };
  return {};
}

function checkCases(contract, fn, { call, epsilon, wrapBare }) {
  return contract.cases.map((item) => {
    try {
      const got = observed(invoke(fn, contract, item.input, call), item.expected, wrapBare);
      const misses = Object.entries(item.expected)
        .filter(([key, want]) => !same(got[key], want, epsilon))
        .map(([field, want]) => ({ field, want, got: got[field] }));
      return { id: item.id, pass: misses.length === 0, misses };
    } catch (error) {
      return { id: item.id, pass: false, misses: [], error: String(error.message) };
    }
  });
}

// Every property is checked against every case input, not only the first one.
function checkProperties(contract, fn, { call, wrapBare, strictFields }) {
  return contract.properties.map((property) => {
    if (property.template !== "bounded_output") {
      return { id: property.id, status: "UNSUPPORTED", template: property.template, violations: [], absent: false };
    }
    const violations = [];
    let absent = false;
    for (const item of contract.cases) {
      let value;
      try {
        value = observed(invoke(fn, contract, item.input, call), item.expected, wrapBare)[property.field];
      } catch (error) {
        violations.push({ case: item.id, reason: `threw: ${error.message}` });
        continue;
      }
      if (value === undefined) {
        absent = true;
        if (strictFields) violations.push({ case: item.id, reason: `${property.field} was not produced` });
      } else if (typeof value !== "number" || value < property.min || (property.max !== undefined && value > property.max)) {
        violations.push({ case: item.id, reason: `${property.field}=${JSON.stringify(value)} is outside the bound` });
      }
    }
    return { id: property.id, status: violations.length > 0 ? "FAIL" : "PASS", violations, absent };
  });
}

// PASS needs every case and every property to hold. A property type the runner cannot check
// makes the result UNKNOWN, never PASS.
export function evaluateContract(contract, fn, options = {}) {
  const settings = { call: "object", epsilon: 0, wrapBare: false, strictFields: true, ...options };
  const cases = checkCases(contract, fn, settings);
  const properties = checkProperties(contract, fn, settings);
  let status = "PASS";
  if (properties.some((property) => property.status === "UNSUPPORTED")) status = "UNKNOWN";
  if (cases.some((item) => !item.pass) || properties.some((property) => property.status === "FAIL")) status = "FAIL";
  return { id: contract.id, status, cases, properties };
}

export function evaluateAll(contracts, functions, options = {}) {
  return contracts.map((contract) => {
    const fn = functions.get(contract.id);
    if (typeof fn !== "function") {
      return { id: contract.id, status: "MISSING", cases: [], properties: [] };
    }
    return evaluateContract(contract, fn, options);
  });
}

// Builds a function from source text. A first parameter written as a destructured object
// receives the input record; any other signature receives the values positionally.
// The source is executed, so only run files you wrote or reviewed.
export function functionFromSource(source, contract) {
  const trimmed = source.trim();
  const fn = new Function(`return (${trimmed})`)();
  const destructured = /^(?:function\s*\w*\s*)?\(\s*\{/.test(trimmed);
  return (input) => (destructured ? fn(input) : fn(...contract.target.inputs.map((name) => input[name])));
}

// Each entry is { id, label?, source }: a wrong implementation a reviewer wrote for contract `id`.
// SURVIVES means the contract lets it through (the contract is weak against it).
// CAUGHT means the contract's cases or properties reject it.
export function runCounterexamples(contracts, entries, options = {}) {
  const byId = new Map(contracts.map((contract) => [contract.id, contract]));
  return entries.map((entry) => {
    const contract = byId.get(entry.id);
    if (!contract) return { id: entry.id, label: entry.label ?? null, verdict: "NO_CONTRACT" };
    let fn;
    try {
      fn = functionFromSource(entry.source, contract);
    } catch (error) {
      return { id: entry.id, label: entry.label ?? null, verdict: "UNPARSEABLE", error: String(error.message) };
    }
    const result = evaluateContract(contract, fn, { wrapBare: true, strictFields: false, call: "object", ...options });
    return {
      id: entry.id,
      label: entry.label ?? null,
      verdict: result.status === "PASS" ? "SURVIVES" : "CAUGHT",
      propertyFieldAbsent: result.properties.some((property) => property.absent),
      result,
    };
  });
}
