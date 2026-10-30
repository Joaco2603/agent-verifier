import { readFileSync } from "node:fs";
import { gate } from "./gate.mjs";

const file = process.argv[2];
if (!file) {
  process.stderr.write("usage: node src/ci/cli.mjs <change.json>\n");
  process.exit(1);
}
const result = gate(JSON.parse(readFileSync(file, "utf8")));
process.stdout.write(`${JSON.stringify(result)}\n`);
process.exit(result.accepted ? 0 : 1);
