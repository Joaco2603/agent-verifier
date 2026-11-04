import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { stringify, parse } from "yaml";
import Ajv from "ajv/dist/2020.js";

const tasksDir = join(process.cwd(), "experiments", "tasks");
const schema = JSON.parse(await readFile(join(process.cwd(), "contracts", "contract.envelope.schema.json"), "utf8"));
const validate = new Ajv({ allErrors: true, allowUnionTypes: true }).compile(schema);

function safeId(id) {
  return /^RF-\d+$/.test(id) ? id : null;
}

function schemaError() {
  const error = validate.errors?.[0];
  return error ? `${error.instancePath || "(root)"} ${error.message}` : "Contract does not match schema";
}

// Same approach as src/contracts/review.mjs: build the preview, validate it
// against the envelope schema, and only write when it passes.
export async function POST(request, { params }) {
  const { id: rawId } = await params;
  const id = safeId(rawId);
  if (!id) return Response.json({ error: "Invalid task id" }, { status: 400 });
  const body = await request.json().catch(() => null);
  const by = String(body?.by ?? "").trim();
  if (!by) return Response.json({ error: "approver name is required" }, { status: 400 });

  let source;
  let sentence;
  try {
    source = await readFile(join(tasksDir, `${id}.yaml`), "utf8");
    sentence = (await readFile(join(tasksDir, `${id}.txt`), "utf8")).trim();
  } catch {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  const next = { ...parse(source), approval: { status: "approved", by } };
  if (!validate(next)) {
    return Response.json({ error: schemaError() }, { status: 422 });
  }
  const nextSource = stringify(next);
  await writeFile(join(tasksDir, `${id}.yaml`), nextSource);
  return Response.json({ ...next, source: nextSource, sentence, changed: true });
}
