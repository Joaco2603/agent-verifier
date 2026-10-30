import { stringify } from "yaml";

const CLOSED_EXTRA = ["idempotency", "authorization", "permission", "states", "atomicity", "bounds"];

function incompleteClaim(claim) {
  return !claim?.observation;
}

export function proposeContract(request, modelProposal = null) {
  const extra = CLOSED_EXTRA.find((key) => Object.hasOwn(request, key));
  if (extra) return { approved: false, rejected: true, field: extra, proposal: modelProposal, yaml: null };
  const claims = request.claims ?? [];
  const incomplete = claims.filter(incompleteClaim).map((claim) => claim.id);
  const bareCase = (request.cases ?? []).some((item) => !item.expected || Object.keys(item.expected).length === 0);
  if (incomplete.length > 0 || bareCase) {
    return { approved: false, rejected: false, incomplete: incomplete.length ? incomplete : ["case"], proposal: modelProposal, yaml: null };
  }
  const contract = {
    id: request.id,
    name: request.name,
    priority: request.priority,
    gate: request.priority === "critical" ? "block" : request.gate,
    revision: 1,
    approval: { status: "draft", by: "unapproved" },
    target: request.target,
    observables: request.observables,
    preconditions: request.preconditions,
    cases: request.cases,
    properties: request.properties,
    evidence: request.evidence,
    limitations: [request.sentence, ...(request.unstated ?? [])],
  };
  return { approved: false, rejected: false, incomplete: [], proposal: modelProposal, contract, yaml: stringify(contract) };
}
