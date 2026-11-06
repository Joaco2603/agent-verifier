import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

// Maps contract ids to the functions under test.
// `exported` is either an object keyed by contract id, or an array in the order of the
// contracts sorted by id (the shape experiments/agent-fns.mjs already uses).
export function mapFunctions(exported, contracts) {
  const map = new Map();
  if (Array.isArray(exported)) {
    if (exported.length !== contracts.length) {
      throw new Error(`${exported.length} functions for ${contracts.length} contracts`);
    }
    contracts.forEach((contract, index) => map.set(contract.id, exported[index]));
  } else if (exported !== null && typeof exported === "object") {
    for (const contract of contracts) {
      if (typeof exported[contract.id] === "function") map.set(contract.id, exported[contract.id]);
    }
  } else {
    throw new Error("functions must be an object keyed by contract id or an array in id order");
  }
  return map;
}

// Imports a module and reads its functions from `exportName`, else `functions`, else the default export.
export async function loadFunctions(file, contracts, exportName) {
  const module = await import(pathToFileURL(resolve(file)).href);
  const exported = exportName ? module[exportName] : (module.functions ?? module.default);
  if (exported === undefined) {
    throw new Error(`${file} has no export ${exportName ?? '"functions" or default'}`);
  }
  return mapFunctions(exported, contracts);
}
