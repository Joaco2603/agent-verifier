import { checkContract } from "../contracts/check.mjs";
import { contractsChanged } from "../contracts/protect.mjs";
import { trace } from "../audit/trust.mjs";

function stated(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function blocks(row) {
  if (row.state === "PASS") return !stated(row.evidence);
  if (row.state === "NOT_APPLICABLE") return !stated(row.reason);
  return true;
}

function asRecord(row) {
  const missingPass = row.state === "PASS" && !stated(row.evidence);
  const silentSkip = row.state === "NOT_APPLICABLE" && !stated(row.reason);
  return {
    id: row.id,
    revision: row.revision ?? null,
    state: missingPass || silentSkip ? "UNKNOWN" : (row.state ?? "UNKNOWN"),
    evidence: stated(row.evidence) ? row.evidence : null,
    reason: silentSkip ? "reason missing" : (stated(row.reason) ? row.reason.trim() : null),
  };
}

export function gate(change) {
  const rows = [];
  const reported = [];
  const edited = contractsChanged(change.diff ?? "");
  if (edited) {
    rows.push({
      reason: "contract edited",
      approved: change.approved ?? [],
      diff: change.diff,
      author: change.author ?? null,
    });
  }
  if (change.approvalStatus === "draft") {
    rows.push({
      id: change.contractId ?? null,
      revision: null,
      state: "UNKNOWN",
      evidence: null,
      reason: "draft refused",
    });
  }
  if (change.contractPath) {
    try {
      const checked = checkContract(change.contractPath);
      if (!checked.ok) {
        rows.push({
          id: change.contractId ?? null,
          revision: null,
          state: "FAIL",
          evidence: checked.message ?? null,
          reason: checked.stage === "rule" ? `rule ${checked.rule}` : "schema",
        });
      }
    } catch {
      rows.push({
        id: change.contractId ?? null,
        revision: null,
        state: "UNKNOWN",
        evidence: null,
        reason: "contract unreadable",
      });
    }
  }
  for (const row of change.critical ?? []) {
    if (!blocks(row)) continue;
    rows.push(asRecord(row));
  }
  for (const row of change.other ?? []) {
    if (!blocks(row)) continue;
    reported.push(asRecord(row));
  }
  if (change.permissionChange || change.adminChange) {
    const security = change.security;
    const passed = security?.state === "PASS" && stated(security.evidence);
    if (!passed) {
      rows.push({
        id: security?.id ?? change.contractId ?? null,
        revision: security?.revision ?? null,
        state: security?.state === "FAIL" ? "FAIL" : "UNKNOWN",
        evidence: stated(security?.evidence) ? security.evidence : null,
        reason: "permission check required",
      });
    }
  }
  const linked = change.task
    ? trace({
      task: change.task,
      revision: change.revision,
      decisionRevision: change.decisionRevision,
      checks: (change.critical ?? []).map((row) => row.id),
      model: change.model ?? null,
      evidence: (change.critical ?? []).map((row) => row.evidence).find((item) => item) ?? null,
    })
    : null;
  if (linked && !linked.valid) {
    rows.push({
      reason: "revision mismatch",
      revision: change.revision ?? null,
      decisionRevision: change.decisionRevision ?? null,
    });
  }
  return { accepted: rows.length === 0, blocks: rows, reported, oracle: edited ? null : (change.approved ?? []), trace: linked };
}
