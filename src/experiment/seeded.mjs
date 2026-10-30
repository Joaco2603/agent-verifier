import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { stringify } from "yaml";
import { checkContract } from "../contracts/check.mjs";
import { runChecks } from "../checks/run.mjs";
import { contractFromFile } from "./files.mjs";

export function runSeeded(tasks) {
  const dir = mkdtempSync(join(tmpdir(), "seeded-"));
  const rows = [];
  for (const task of tasks) {
    const loaded = contractFromFile(task);
    const contract = loaded.contract;
    const file = loaded.file ?? join(dir, `${contract.id}.yaml`);
    if (!loaded.file) writeFileSync(file, stringify(contract));
    const structural = checkContract(file);
    if (!structural.ok) {
      rows.push({ id: task.contract.id, structural: false, weak: null, message: structural.message });
      continue;
    }
    const executed = runChecks({
      requirementId: contract.id,
      contract,
      implementation: task.seeded,
      harness: () => ({ pass: true }),
      security: contract.priority === "critical" ? { omissionApprovedBy: "experimenter" } : {},
    });
    const checks = executed.results.filter((row) => row.kind === "case" || row.kind === "property");
    rows.push({
      id: task.contract.id,
      structural: true,
      weak: checks.length > 0 && checks.every((row) => row.state === "PASS"),
    });
  }
  return {
    rows,
    W: rows.filter((row) => row.weak === true).length,
    C: null,
    F: null,
    M: null,
    runner: false,
    limitation: "The same author wrote the contract and the seeded bug, so W is a weak estimate. Agent runs and approval minutes are not recorded.",
  };
}
