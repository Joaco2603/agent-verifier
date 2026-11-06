import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fns } from "../../../experiments/agent-fns.mjs";
import { alarm, done, openStart, readLog, report, start } from "../../../src/review/ledger.mjs";
import { loadContracts } from "../../../src/runner/contracts.mjs";
import { evaluateAll } from "../../../src/runner/evaluate.mjs";
import { mapFunctions } from "../../../src/runner/functions.mjs";

export const dynamic = "force-dynamic";

const tasksDir = join(process.cwd(), "experiments", "tasks");
// REVIEW_LOG and REVIEW_KIND let a rehearsal run apart from the real one.
const logFile = process.env.REVIEW_LOG ?? join(process.cwd(), "docs", "experiment", "review-log.jsonl");
const kind = process.env.REVIEW_KIND ?? "human";

function latest(entries, type, id) {
  return entries.filter((entry) => entry.type === type && entry.kind === kind && entry.id === id).at(-1) ?? null;
}

async function state() {
  const contracts = loadContracts(tasksDir);
  const functions = mapFunctions(fns, contracts);
  const results = evaluateAll(contracts, functions);
  const entries = readLog(logFile);
  const items = await Promise.all(
    contracts.map(async (contract) => {
      const result = results.find((row) => row.id === contract.id);
      const sentence = (await readFile(join(tasksDir, `${contract.id}.txt`), "utf8")).trim();
      const finished = latest(entries, "done", contract.id);
      const open = openStart(entries.filter((entry) => entry.kind === kind), contract.id);
      const judged = latest(entries, "alarm", contract.id);
      return {
        id: contract.id,
        sentence,
        contract,
        functionSource: String(functions.get(contract.id)),
        gate: {
          status: result.status,
          cases: result.cases.filter((item) => !item.pass).map((item) => ({
            ...item,
            input: contract.cases.find((row) => row.id === item.id).input,
          })),
        },
        review: open
          ? { state: "running", startedAt: open.at }
          : finished
            ? { state: "done", minutes: finished.minutes, verdict: finished.verdict, note: finished.note }
            : { state: "todo" },
        alarm: judged ? { judgement: judged.judgement, note: judged.note, by: judged.by } : null,
      };
    }),
  );
  const failIds = items.filter((item) => item.gate.status === "FAIL").map((item) => item.id);
  return { kind, logFile, items, report: report(entries, items.map((item) => item.id), failIds) };
}

export async function GET() {
  try {
    return Response.json(await state());
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  const { action, id, by, verdict, judgement, note } = body;
  try {
    const known = loadContracts(tasksDir).map((contract) => contract.id);
    if (!known.includes(id)) return Response.json({ error: "Unknown task id" }, { status: 404 });
    const name = String(by ?? "").trim();
    if (action === "start") start(logFile, { id, by: name, kind });
    else if (action === "done") done(logFile, { id, verdict, note: note ?? "" });
    else if (action === "alarm") alarm(logFile, { id, by: name, kind, judgement, note });
    else return Response.json({ error: "Unknown action" }, { status: 400 });
    return Response.json(await state());
  } catch (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }
}
