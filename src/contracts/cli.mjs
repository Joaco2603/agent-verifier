import { checkContract } from "./check.mjs";

const file = process.argv[2];
if (!file) {
  process.stderr.write("usage: node src/contracts/cli.mjs <file>\n");
  process.exit(1);
}

const result = checkContract(file);
process.stdout.write(`${JSON.stringify(result)}\n`);
process.exit(result.ok ? 0 : 1);
