import { spawnSync } from "node:child_process";
import { MemoryError, MemoryPort } from "./port.mjs";

export function runEngram(args, env = process.env) {
  const proc = spawnSync("engram", args, { encoding: "utf8", env });
  return {
    status: proc.status ?? 1,
    stdout: proc.stdout ?? "",
    stderr: proc.stderr ?? "",
  };
}

export function parseSave(stdout) {
  const match = /Memory saved: #(\d+) /.exec(stdout);
  return match ? match[1] : null;
}

export function parseSearch(stdout) {
  const memories = [];
  const lines = stdout.split(/\r?\n/);
  for (let i = 0; i < lines.length; i += 1) {
    const header = /^\[\d+\] #(\d+) \(([^)]+)\) — (.*)$/.exec(lines[i]);
    if (!header) continue;
    const body = (lines[i + 1] ?? "").trim();
    const meta = lines[i + 2] ?? "";
    const project = /project: ([^|]+)/.exec(meta)?.[1]?.trim() ?? "";
    memories.push({
      id: header[1],
      type: header[2],
      title: header[3],
      body,
      project,
    });
  }
  return memories;
}

export class EngramMemory extends MemoryPort {
  constructor({
    run = runEngram,
    project = "ai-skill-reviewer",
    scope = "project",
    env = process.env,
  } = {}) {
    super();
    this.name = "engram";
    this.run = run;
    this.project = project;
    this.scope = scope;
    this.env = env;
  }

  save({ title, body, type = "decision" }) {
    if (!title || !body) {
      throw new MemoryError("title and body are required", { backend: this.name });
    }
    const result = this.run(
      ["save", title, body, "--type", type, "--project", this.project, "--scope", this.scope],
      this.env,
    );
    const id = parseSave(result.stdout);
    if (result.status !== 0 || !id) {
      throw new MemoryError(result.stderr.trim() || result.stdout.trim() || "engram save failed", {
        backend: this.name,
      });
    }
    return { id, title, type };
  }

  search(query, { limit = 5, type } = {}) {
    const args = ["search", query, "--project", this.project, "--scope", this.scope, "--limit", String(limit)];
    if (type) args.push("--type", type);
    const result = this.run(args, this.env);
    if (result.status !== 0) {
      throw new MemoryError(result.stderr.trim() || result.stdout.trim() || "engram search failed", {
        backend: this.name,
      });
    }
    return parseSearch(result.stdout);
  }
}
