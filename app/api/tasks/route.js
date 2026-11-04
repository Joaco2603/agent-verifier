import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { corpusSyncStatus } from "../../../experiments/build-corpus.mjs";

const tasksDir = join(process.cwd(), "experiments", "tasks");

export async function GET() {
  try {
    const names = (await readdir(tasksDir)).filter((name) => /^RF-\d+\.yaml$/.test(name)).sort();
    const tasks = await Promise.all(names.map(async (name) => {
      const value = parse(await readFile(join(tasksDir, name), "utf8"));
      return { id: value.id, name: value.name, sentence: await readFile(join(tasksDir, `${value.id}.txt`), "utf8").then((text) => text.trim()), approval: value.approval, revision: value.revision };
    }));
    const corpus = await corpusSyncStatus();
    return Response.json({ tasks, corpus });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
