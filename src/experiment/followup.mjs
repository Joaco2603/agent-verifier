import { performance } from "node:perf_hooks";
import { contractFromFile } from "./files.mjs";

function call(fn, input) {
  try {
    return fn(input);
  } catch {
    return null;
  }
}

export function shapeFalseAlarm(actual, expected) {
  if (actual == null || typeof actual !== "object" || Array.isArray(actual)) return false;
  const entries = Object.entries(expected);
  const mismatched = entries.filter(([key, value]) => actual[key] !== value);
  if (mismatched.length === 0) return false;
  const values = Object.values(actual);
  return mismatched.every(([, value]) => values.includes(value));
}

export function simulateFollowup(tasks, fns) {
  const started = performance.now();
  const falseAlarms = [];
  for (let index = 0; index < tasks.length; index += 1) {
    const contract = contractFromFile(tasks[index]).contract;
    const item = contract.cases[0];
    if (shapeFalseAlarm(call(fns[index], item.input), item.expected)) falseAlarms.push(contract.id);
  }
  return {
    label: "simulated follow-up",
    manualReview: false,
    cost: { time: (performance.now() - started) / 1000, price: null },
    escapes: {
      count: 0,
      limit: "Every known miss was already a FAIL. There is no later run, so this is not a production escape rate.",
    },
    falseAlarms: {
      count: falseAlarms.length,
      ids: falseAlarms,
      limit: "A FAIL counts here only when every expected value is already present under another key. A person has not reviewed it.",
    },
  };
}
