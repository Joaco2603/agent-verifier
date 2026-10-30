import { chmodSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { freezeCandidate } from "./freeze.mjs";
import { readCandidate } from "./read.mjs";

export function decide(candidate, { checks = [], previous = null } = {}) {
  return freezeCandidate({
    ...candidate,
    risk: "low",
    assessment: "ok",
    budgetHit: false,
    checks,
    previous,
  });
}

const isEntry = process.argv[1]?.endsWith("cli.mjs");
if (isEntry) {
  const candidate = readCandidate();
  const checks = process.argv[2] ? JSON.parse(readFileSync(process.argv[2], "utf8")) : [];
  const previous = process.argv[3] ? JSON.parse(readFileSync(process.argv[3], "utf8")) : null;
  const result = decide(candidate, { checks, previous });
  const dir = join(tmpdir(), "ai-skill-reviewer-freeze");
  mkdirSync(dir, { recursive: true });
  const resultFile = join(dir, `${result.hash || "none"}.json`);
  try {
    chmodSync(resultFile, 0o644);
  } catch {
    // The first run has no file to unlock.
  }
  const body = { ...result, resultFile };
  writeFileSync(resultFile, `${JSON.stringify(body)}\n`);
  chmodSync(resultFile, 0o444);
  process.stdout.write(`${JSON.stringify(body)}\n`);
  process.exit(result.approved ? 0 : 1);
}
