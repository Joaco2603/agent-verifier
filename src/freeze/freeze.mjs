import { createHash } from "node:crypto";
import { contractsChanged } from "../contracts/protect.mjs";
import { classify } from "../decision/classify.mjs";

function diffVisible(hash, diff) {
  return Boolean(hash) && typeof diff === "string" && diff.length > 0;
}

function criticalFailure(checks) {
  return checks.some((check) => check.state === "FAIL" && check.critical === true);
}

function depthOf(input, checks) {
  const structural =
    input.risk === "low" &&
    input.assessment === "ok" &&
    input.budgetHit === false &&
    !criticalFailure(checks);
  return structural ? "structural" : "full";
}

function candidateIdFor(hash, diff) {
  const digest = createHash("sha256").update(diff).digest("hex");
  return `${hash}:${digest}`;
}

export function freezeCandidate(input) {
  const { hash, diff, previous = null } = input;
  const checks = input.checks ?? [];
  if (!diffVisible(hash, diff)) {
    return { approved: false, reason: "diff not visible" };
  }
  const candidateId = candidateIdFor(hash, diff);
  if (contractsChanged(diff)) {
    return {
      hash,
      candidateId,
      approved: false,
      reason: "contract edited",
    };
  }
  if (previous && previous.candidateId !== candidateId) {
    return { hash, candidateId, approved: false, reason: "candidate changed" };
  }
  if (previous?.correction === true) {
    const classified = classify(checks);
    return {
      hash,
      candidateId,
      depth: depthOf(input, checks),
      rollup: classified.rollup,
      approved: false,
      reason: "correction already used",
    };
  }
  const classified = classify(checks);
  const critical = criticalFailure(checks);
  const correction = Boolean(previous && previous.approved === false);
  const approved = !critical && classified.rollup !== "UNKNOWN" && classified.rollup !== "NOT_APPLICABLE";
  const result = {
    hash,
    candidateId,
    depth: depthOf(input, checks),
    rollup: classified.rollup,
    approved,
  };
  if (correction) result.correction = true;
  return result;
}
