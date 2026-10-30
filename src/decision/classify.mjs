const STATES = new Set(["PASS", "FAIL", "UNKNOWN", "NOT_APPLICABLE"]);

function evidenceText(evidence) {
  return typeof evidence === "string" && evidence.length > 0 ? evidence : null;
}

function rollupOf(checks) {
  if (checks.some((check) => check.state === "FAIL")) return "FAIL";
  if (checks.some((check) => check.state === "UNKNOWN")) return "UNKNOWN";
  if (checks.every((check) => check.state === "NOT_APPLICABLE")) return "NOT_APPLICABLE";
  return "PASS";
}

export function classify(checks, _explanation) {
  const stored = checks.map((check) => {
    if (!STATES.has(check.state)) {
      throw new Error(`illegal state ${check.state}`);
    }
    const evidence = evidenceText(check.evidence);
    if (check.state === "PASS" && evidence === null) {
      throw new Error("empty evidence");
    }
    const reason = typeof check.reason === "string" && check.reason.length > 0 ? check.reason : null;
    if (check.state === "NOT_APPLICABLE" && reason === null) {
      throw new Error("NOT_APPLICABLE requires a reason");
    }
    return { id: check.id, state: check.state, evidence, reason };
  });
  return { checks: stored, rollup: rollupOf(stored) };
}
