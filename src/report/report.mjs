import { classify } from "../decision/classify.mjs";

function hasLocation(finding) {
  const file = finding.file ?? finding.location?.file;
  const line = finding.line ?? finding.location?.line;
  return typeof file === "string" && file.length > 0 && line !== null && line !== undefined && line !== "";
}

function hasCommand(finding) {
  const command = finding.command ?? finding.reproduction;
  return typeof command === "string" && command.length > 0;
}

function sameCitation(reference, citation) {
  if (reference === citation) return true;
  if (reference && citation && typeof reference === "object" && typeof citation === "object") {
    return JSON.stringify(reference) === JSON.stringify(citation);
  }
  return false;
}

export function rejectCitation(stored, citation) {
  const references = stored.references ?? [];
  if (!references.some((reference) => sameCitation(reference, citation))) {
    throw new Error("citation not in references");
  }
}

export function report(stored, explanation) {
  const checks = (stored.checks ?? []).map((check) => ({ ...check }));
  const limitations = [...(stored.limitations ?? [])];
  const notRun = new Set(stored.notRun ?? []);
  for (const check of checks) {
    if (check.notRun === true || check.ran === false) notRun.add(check.id);
  }
  for (const id of notRun) {
    const existing = checks.find((check) => check.id === id);
    if (!existing) {
      checks.push({ id, state: "UNKNOWN", evidence: null, reason: null });
    } else if (existing.state == null || existing.state === "UNKNOWN") {
      existing.state = "UNKNOWN";
    }
    if (!limitations.includes(id)) limitations.push(id);
  }
  if (!stored.defectHistory?.length && !limitations.includes("empty defect history")) {
    limitations.push("empty defect history");
  }
  for (const file of stored.unparsed ?? []) {
    const note = `unparsed ${file}`;
    if (!limitations.includes(note)) limitations.push(note);
  }
  for (const call of stored.unseenCalls ?? []) {
    const note = `unseen dynamic call ${call}`;
    if (!limitations.includes(note)) limitations.push(note);
  }
  const classified = classify(checks);
  const result = {
    rollup: classified.rollup,
    checks: classified.checks,
    U: null,
    findings: (stored.findings ?? []).filter((finding) => hasLocation(finding) || hasCommand(finding)),
    references: [...(stored.references ?? [])],
    limitations,
    revision: stored.revision,
    contractRevision: stored.contractRevision ?? null,
    fixture: stored.fixture ?? null,
    command: stored.command,
  };
  if (explanation !== undefined) result.explanation = explanation;
  return result;
}
