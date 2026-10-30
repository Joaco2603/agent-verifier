import { contractFromFile } from "./files.mjs";

function caseFailed(task, fn) {
  const contract = contractFromFile(task).contract;
  for (const item of contract.cases) {
    try {
      const actual = fn(item.input);
      if (Object.entries(item.expected).some(([key, value]) => actual?.[key] !== value)) return true;
    } catch {
      return true;
    }
  }
  for (const property of contract.properties) {
    const sample = contract.cases[0];
    try {
      const actual = fn(sample.input);
      const value = actual?.[property.field];
      if (typeof value !== "number" || value < property.min) return true;
      if (property.max !== undefined && value > property.max) return true;
    } catch {
      return true;
    }
  }
  return false;
}

export function measureAgent(tasks, fns, agentTestsPass) {
  const rows = tasks.map((task, index) => {
    const failed = caseFailed(task, fns[index]);
    return { id: task.contract.id, contractFailed: failed };
  });
  const contractFailed = rows.filter((row) => row.contractFailed);
  return {
    rows,
    C: agentTestsPass ? contractFailed.length : null,
    F: null,
    M: null,
    needsHuman: rows.filter((row) => !row.contractFailed).map((row) => row.id),
    runner: false,
  };
}
