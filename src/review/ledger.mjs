import { appendFileSync, existsSync, readFileSync } from "node:fs";

// An append-only log of review sessions. Each line is one JSON event:
//   start  a reviewer opened a contract            { id, by, kind, at }
//   done   the reviewer finished it                { id, by, kind, at, startedAt, minutes, verdict, note }
//   alarm  the reviewer read a FAIL and judged it  { id, by, kind, at, judgement, note }
// Minutes come only from the clock between a start and its done. They cannot be typed in.
export const KINDS = ["human", "claude", "subagent"];
export const VERDICTS = ["approve", "reject"];
export const JUDGEMENTS = ["defect", "false_alarm", "unclear"];

export function readLog(file) {
  if (!existsSync(file)) return [];
  return readFileSync(file, "utf8")
    .split("\n")
    .filter(Boolean)
    .map((line) => JSON.parse(line));
}

function append(file, entry) {
  appendFileSync(file, JSON.stringify(entry) + "\n");
  return entry;
}

function oneOf(value, allowed, name) {
  if (!allowed.includes(value)) throw new Error(`${name} must be one of ${allowed.join(", ")}`);
}

// The start that has no done after it, if any.
export function openStart(entries, id) {
  let open = null;
  for (const entry of entries) {
    if (entry.id !== id) continue;
    if (entry.type === "start") open = entry;
    if (entry.type === "done") open = null;
  }
  return open;
}

export function start(file, { id, by, kind }, now = Date.now()) {
  oneOf(kind, KINDS, "kind");
  if (!by) throw new Error("by is required");
  if (openStart(readLog(file), id)) throw new Error(`${id} already has a review in progress`);
  return append(file, { type: "start", id, by, kind, at: now });
}

export function done(file, { id, verdict, note = "" }, now = Date.now()) {
  oneOf(verdict, VERDICTS, "verdict");
  const open = openStart(readLog(file), id);
  if (!open) throw new Error(`${id} has no review in progress`);
  const minutes = (now - open.at) / 60000;
  return append(file, { type: "done", id, by: open.by, kind: open.kind, at: now, startedAt: open.at, minutes, verdict, note });
}

export function alarm(file, { id, by, kind, judgement, note }, now = Date.now()) {
  oneOf(kind, KINDS, "kind");
  oneOf(judgement, JUDGEMENTS, "judgement");
  if (!by) throw new Error("by is required");
  if (!note || !note.trim()) throw new Error("note is required: say why the FAIL is or is not a defect");
  return append(file, { type: "alarm", id, by, kind, at: now, judgement, note });
}

function median(values) {
  if (values.length === 0) return null;
  const sorted = values.slice().sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function latestById(entries, type, kind) {
  const latest = new Map();
  for (const entry of entries) if (entry.type === type && entry.kind === kind) latest.set(entry.id, entry);
  return latest;
}

// Summarizes the log. Only `human` entries feed the gate numbers. A number that needs every
// contract reviewed stays null until every contract is, so a partial run cannot pass for a full one.
// `ids` are all contract ids. `failIds` are the ids whose gate result was FAIL (null if unknown).
export function report(entries, ids, failIds = null) {
  const byKind = {};
  for (const kind of KINDS) {
    const reviews = latestById(entries, "done", kind);
    const alarms = latestById(entries, "alarm", kind);
    byKind[kind] = {
      reviewed: reviews.size,
      approved: [...reviews.values()].filter((entry) => entry.verdict === "approve").length,
      rejected: [...reviews.values()].filter((entry) => entry.verdict === "reject").length,
      medianMinutes: median([...reviews.values()].map((entry) => entry.minutes)),
      alarms: {
        judged: alarms.size,
        defect: [...alarms.values()].filter((entry) => entry.judgement === "defect").length,
        false_alarm: [...alarms.values()].filter((entry) => entry.judgement === "false_alarm").length,
        unclear: [...alarms.values()].filter((entry) => entry.judgement === "unclear").length,
      },
    };
  }
  const humanReviews = latestById(entries, "done", "human");
  const humanAlarms = latestById(entries, "alarm", "human");
  const reviewsComplete = ids.length > 0 && ids.every((id) => humanReviews.has(id));
  const alarmsComplete = failIds !== null && failIds.every((id) => humanAlarms.has(id));
  return {
    byKind,
    gate: {
      source: "human entries only",
      approvalMinutes: {
        reviewed: `${ids.filter((id) => humanReviews.has(id)).length}/${ids.length}`,
        median: reviewsComplete ? median(ids.map((id) => humanReviews.get(id).minutes)) : null,
      },
      falseAlarms: {
        judged: failIds === null ? null : `${failIds.filter((id) => humanAlarms.has(id)).length}/${failIds.length}`,
        count: alarmsComplete ? failIds.filter((id) => humanAlarms.get(id).judgement === "false_alarm").length : null,
        unclear: alarmsComplete ? failIds.filter((id) => humanAlarms.get(id).judgement === "unclear").length : null,
      },
    },
    note: "claude and subagent entries are shown for comparison and never enter the gate.",
  };
}
