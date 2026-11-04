import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { isDeepStrictEqual } from "node:util";
import { parse, stringify } from "yaml";
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

async function readTask(id) {
  const source = await readFile(join(tasksDir, `${id}.yaml`), "utf8");
  const sentence = await readFile(join(tasksDir, `${id}.txt`), "utf8");
  return { source, sentence: sentence.trim() };
}

export async function GET(_request, { params }) {
  const { id: rawId } = await params;
  const id = safeId(rawId);
  if (!id) return Response.json({ error: "Invalid task id" }, { status: 400 });
  try {
    const { source, sentence } = await readTask(id);
    const value = parse(source);
    return Response.json({ ...value, source, sentence });
  } catch {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }
}

export async function PUT(request, { params }) {
  const { id: rawId } = await params;
  const id = safeId(rawId);
  if (!id) return Response.json({ error: "Invalid task id" }, { status: 400 });
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: "Invalid JSON body" }, { status: 400 });

  let value;
  if (body.contract !== undefined) {
    value = body.contract;
  } else {
    try {
      value = parse(body.yaml);
    } catch (error) {
      return Response.json({ error: `Invalid YAML: ${error.message}` }, { status: 422 });
    }
  }
  if (!value || typeof value !== "object" || value.id !== id || !validate(value)) {
    return Response.json({ error: schemaError() }, { status: 422 });
  }

  let current;
  try {
    const { source, sentence } = await readTask(id);
    current = { value: parse(source), source, sentence };
  } catch {
    return Response.json({ error: "Task not found" }, { status: 404 });
  }

  const sentence = String(body.sentence ?? "").trim();
  const unchanged = isDeepStrictEqual(value, current.value) && sentence === current.sentence;
  if (unchanged) {
    return Response.json({ ...current.value, source: current.source, sentence: current.sentence, changed: false });
  }

  const next = {
    ...value,
    revision: current.value.revision + 1,
    approval: { status: "draft", by: "unapproved" },
  };
  if (!validate(next)) {
    return Response.json({ error: schemaError() }, { status: 422 });
  }
  const source = stringify(next);
  await writeFile(join(tasksDir, `${id}.yaml`), source);
  await writeFile(join(tasksDir, `${id}.txt`), `${sentence}\n`);
  return Response.json({ ...next, source, sentence, changed: true });
}
