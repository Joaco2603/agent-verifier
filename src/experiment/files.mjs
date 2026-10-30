import { existsSync, readFileSync } from "node:fs";
import { parse } from "yaml";

export function contractFromFile(task) {
  const file = `experiments/tasks/${task.contract.id}.yaml`;
  if (!existsSync(file)) return { contract: task.contract, file: null };
  return { contract: parse(readFileSync(file, "utf8")), file };
}
