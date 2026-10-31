import { chmodSync, lstatSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { freezeCandidate } from "./freeze.mjs";
import { readCandidate } from "./read.mjs";

export function decide(candidate, { checks = [], previous = null } = {}) {
  return freezeCandidate({
    ...candidate,
    checks,
    previous,
  });
}

function receiptPath(hash) {
  const dir = join(tmpdir(), "ai-skill-reviewer-freeze");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
  return join(dir, `${hash || "none"}.json`);
}

function writeReceipt(resultFile, body) {
  try {
    const info = lstatSync(resultFile);
    if (info.isSymbolicLink()) unlinkSync(resultFile);
    else chmodSync(resultFile, 0o600);
  } catch {
    // The first run has no file to replace.
  }
  writeFileSync(resultFile, `${JSON.stringify(body)}\n`);
  chmodSync(resultFile, 0o400);
}

function emit(body) {
  const resultFile = receiptPath(body.hash);
  const stored = { ...body, resultFile };
  writeReceipt(resultFile, stored);
  process.stdout.write(`${JSON.stringify(stored)}\n`);
  process.exit(stored.approved ? 0 : 1);
}

function readJson(path) {
  try {
    return { value: JSON.parse(readFileSync(path, "utf8")) };
  } catch (error) {
    return { error };
  }
}

const isEntry = process.argv[1]?.endsWith("cli.mjs");
if (isEntry) {
  const candidate = readCandidate();
  const checksFile = process.argv[2] ? readJson(process.argv[2]) : { value: [] };
  const previousFile = process.argv[3] ? readJson(process.argv[3]) : { value: null };
  if (checksFile.error || previousFile.error || !Array.isArray(checksFile.value)) {
    emit({ hash: candidate.hash, approved: false, reason: "input not readable" });
  }
  let result;
  try {
    result = decide(candidate, { checks: checksFile.value, previous: previousFile.value });
  } catch (error) {
    emit({ hash: candidate.hash, approved: false, reason: "input not readable", error: error.message });
  }
  emit(result);
}
