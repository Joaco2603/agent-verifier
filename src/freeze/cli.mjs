import { createHash } from "node:crypto";
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

function keepsLedger(record) {
  if (!record?.candidateId) return false;
  if (record.reason === "candidate changed" || record.reason === "diff not visible" || record.reason === "input not readable") {
    return false;
  }
  if (record.rollup === "NOT_APPLICABLE") return false;
  return true;
}

export function receiptFile(hash, repo = "") {
  const dir = join(tmpdir(), "ai-skill-reviewer-freeze");
  mkdirSync(dir, { recursive: true, mode: 0o700 });
  chmodSync(dir, 0o700);
  const id = /^[0-9a-f]{7,64}$/i.test(hash || "") ? hash : "none";
  const repoId = createHash("sha256").update(String(repo)).digest("hex").slice(0, 16);
  return join(dir, `${repoId}-${id}.json`);
}

export function recallPrevious(hash, repo = "") {
  const file = receiptFile(hash, repo);
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
  const resultFile = receiptFile(body.hash, body.repo);
  const stored = { ...body, resultFile };
  if (!write) {
    process.stdout.write(`${JSON.stringify(stored)}\n`);
    process.exit(stored.approved ? 0 : 1);
  }
  const existing = recallPrevious(body.hash, body.repo);
  if (existing.error || (existing.value && keepsLedger(existing.value) && !keepsLedger(body))) {
    const reason = existing.error ? "receipt not writable" : body.reason;
    const refusal = existing.error
      ? { hash: body.hash, approved: false, reason, resultFile }
      : stored;
    process.stdout.write(`${JSON.stringify(refusal)}\n`);
    process.exit(1);
  }
  try {
    const info = lstatSync(resultFile);
    if (!info.isFile()) {
      process.stdout.write(`${JSON.stringify({ hash: body.hash, approved: false, reason: "receipt not writable" })}\n`);
      process.exit(1);
    }
    chmodSync(resultFile, 0o600);
  } catch {
    // The first run has no file to replace.
  }
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
  const previousFile = supplied ?? recallPrevious(candidate.hash, candidate.repo);
  if (checksFile.error || supplied?.error || !Array.isArray(checksFile.value)) {
    emit({ hash: candidate.hash, repo: candidate.repo, approved: false, reason: "input not readable" });
  }
  if (previousFile.error) {
    emit({ hash: candidate.hash, repo: candidate.repo, approved: false, reason: "receipt not writable" }, { write: false });
  }
  let result;
  try {
    result = decide(candidate, { checks: checksFile.value, previous: previousFile.value });
    if (result.reason === "candidate changed") {
      result = decide(candidate, { checks: checksFile.value, previous: result });
    }
  } catch (error) {
    emit({
      hash: candidate.hash,
      repo: candidate.repo,
      approved: false,
      reason: "input not readable",
      error: error.message,
    });
  }
  emit({ ...result, repo: candidate.repo });
}
