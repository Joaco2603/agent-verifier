import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "yaml";

// Reads every *.yaml / *.yml file in a folder and returns the contracts ordered by id.
// The runner does not validate the envelope; use src/contracts/check.mjs for that.
export function loadContracts(dir) {
  const contracts = readdirSync(dir)
    .filter((file) => /\.ya?ml$/.test(file))
    .sort()
    .map((file) => {
      const contract = parse(readFileSync(join(dir, file), "utf8"));
      for (const key of ["id", "target", "cases", "properties"]) {
        if (contract?.[key] === undefined) throw new Error(`${file}: contract has no "${key}"`);
      }
      return contract;
    });
  if (contracts.length === 0) throw new Error(`no contract files in ${dir}`);
  return contracts.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
}
