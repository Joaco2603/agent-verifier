import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parse } from "yaml";

function fence(readme, lang) {
  const marker = `\`\`\`${lang}\n`;
  const start = readme.indexOf(marker);
  const end = readme.indexOf("```", start + marker.length);
  return readme.slice(start + marker.length, end);
}

test("the saved schema and RF-01 match the Module A README", () => {
  const readme = readFileSync("docs/module-a/README.md", "utf8");
  const schema = JSON.parse(readFileSync("contracts/contract.envelope.schema.json", "utf8"));
  const contract = parse(readFileSync("contracts/RF-01.yaml", "utf8"));
  assert.deepEqual(schema, JSON.parse(fence(readme, "json")));
  assert.deepEqual(contract, parse(fence(readme, "yaml")));
});
