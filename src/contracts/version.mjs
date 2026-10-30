import { createHash } from "node:crypto";

export function gitBlob(bytes) {
  const body = Buffer.from(bytes);
  return createHash("sha1").update(`blob ${body.length}\0`).update(body).digest("hex");
}

export function approveVersion(history, bytes, by) {
  if (!by) return { approved: false, history };
  const version = {
    id: history.length + 1,
    hash: gitBlob(bytes),
    by,
    bytes,
  };
  return { approved: true, version, history: [...history, version] };
}

export function loadVersion(history, id) {
  return history.find((version) => version.id === id) ?? null;
}

export function linkRequirement(links, link) {
  if (!link.requirementId || !link.testId || !link.reportId) return links;
  return [...links, link];
}

export function requirementComplete(links, requirementId) {
  const rows = links.filter((link) => link.requirementId === requirementId);
  return { complete: rows.length > 0, rows };
}

export function humanApproval({ critical = false, interpretable = true, by, versionId, hash }) {
  const record = by && versionId && hash ? { by, versionId, hash } : null;
  if (!record) return { approved: false, record: null };
  if ((critical || interpretable === false) && !by) return { approved: false, record: null };
  return { approved: true, record };
}
