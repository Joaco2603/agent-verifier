import { chmodSync, lstatSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
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

export function recallPrevious(hash) {
  const file = receiptPath(hash);
  try {
    const info = lstatSync(file);
    if (!info.isFile()) return { error: new Error("receipt is not a file") };
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { error: new Error("receipt is not a record") };
    }
    const { resultFile, ...previous } = parsed;
    return { value: previous };
  } catch (error) {
    if (error.code === "ENOENT") return { value: null };
    return { error };
  }
}

function emit(body, { write = true } = {}) {
  if (!write) {
    process.stdout.write(`${JSON.stringify(body)}\n`);
    process.exit(body.approved ? 0 : 1);
  }
  const resultFile = receiptPath(body.hash);
  try {
    const info = lstatSync(resultFile);
    if (info.isSymbolicLink()) {
      const refusal = { hash: body.hash, approved: false, reason: "receipt not writable" };
      process.stdout.write(`${JSON.stringify(refusal)}\n`);
      process.exit(1);
    }
    chmodSync(resultFile, 0o600);
  } catch {
    // The first run has no file to replace.
  }
  const stored = { ...body, resultFile };
  writeFileSync(resultFile, `${JSON.stringify(stored)}\n`);
  chmodSync(resultFile, 0o400);
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
  const supplied = process.argv[3] ? readJson(process.argv[3]) : null;
  const previousFile = supplied ?? recallPrevious(candidate.hash);
  if (checksFile.error || supplied?.error || !Array.isArray(checksFile.value)) {
    emit({ hash: candidate.hash, approved: false, reason: "input not readable" });
  }
  if (previousFile.error) {
    emit({ hash: candidate.hash, approved: false, reason: "receipt not writable" }, { write: false });
  }
  let result;
  try {
    result = decide(candidate, { checks: checksFile.value, previous: previousFile.value });
  } catch (error) {
    emit({ hash: candidate.hash, approved: false, reason: "input not readable", error: error.message });
  }
  emit(result);
}
