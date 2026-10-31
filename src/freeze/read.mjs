import { spawnSync } from "node:child_process";
import { closeSync, mkdtempSync, openSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const maxBuffer = 32 * 1024 * 1024;

function captureDiff(args, cwd) {
  const dir = mkdtempSync(join(tmpdir(), "freeze-diff-"));
  const file = join(dir, "diff");
  const fd = openSync(file, "w");
  try {
    const result = spawnSync("git", args, { cwd, stdio: ["ignore", fd, "pipe"], maxBuffer });
    const stderr = result.stderr ? result.stderr.toString() : "";
    if (result.status !== 0 || result.error) {
      return { status: result.status, stdout: "", stderr, error: result.error };
    }
    return { status: 0, stdout: readFileSync(file, "utf8"), stderr };
  } finally {
    closeSync(fd);
    rmSync(dir, { recursive: true, force: true });
  }
}

function git(args, input, cwd) {
  const command = ["-c", "diff.mnemonicPrefix=false", "-c", "diff.relative=false", "-c", "color.ui=false", ...args];
  if (args[0] === "diff") return captureDiff(command, cwd);
  return spawnSync("git", command, { encoding: "utf8", input, maxBuffer, cwd });
}

function quotePath(path) {
  if (!/[\s"\\]/.test(path)) return path;
  return `"${path.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function untracked(stdout) {
  const paths = [];
  const text = stdout ?? "";
  let index = 0;
  while (index < text.length) {
    const end = text.indexOf("\0", index);
    if (end === -1) break;
    const record = text.slice(index, end);
    index = end + 1;
    if (record.length < 4) continue;
    const status = record.slice(0, 2);
    if (status[0] === "R" || status[0] === "C") {
      const next = text.indexOf("\0", index);
      if (next === -1) break;
      index = next + 1;
    }
    if (status === "??") paths.push(record.slice(3));
  }
  return paths;
}

function failed(result) {
  return !result || result.status !== 0 || result.error;
}

function note(result) {
  return (result?.stderr || result?.error?.message || "").trim();
}

function stub(path, blob) {
  const left = quotePath(`a/${path}`);
  const right = quotePath(`b/${path}`);
  return `diff --git ${left} ${right}\nindex 0000000..${blob}\n--- /dev/null\n+++ ${right}`;
}

function keptDiff(tracked, extras) {
  const body = (tracked ?? "").replace(/\n$/, "");
  return [body, ...extras].filter((part) => part.length > 0).join("\n");
}

export function readCandidate(run = git) {
  const root = run(["rev-parse", "--show-toplevel"]);
  const cwd = root?.status === 0 ? root.stdout.trim() : undefined;
  const head = run(["rev-parse", "HEAD"], undefined, cwd);
  const hash = head?.status === 0 ? head.stdout.trim() : "";
  const tracked = run(["diff", "--no-ext-diff", "--no-color", "--default-prefix", "--full-index", "HEAD"], undefined, cwd);
  const status = run(["status", "--porcelain=v1", "-z", "-uall"], undefined, cwd);
  if (!hash || failed(tracked) || failed(status)) {
    const error = [note(tracked), note(status)].filter(Boolean).join("\n");
    return { hash, diff: "", ...(error ? { error } : {}) };
  }
  const paths = untracked(status.stdout);
  if (paths.some((path) => path.includes("\n"))) {
    return { hash, diff: "", error: "untracked path is not hashable" };
  }
  const extras = [];
  if (paths.length > 0) {
    const blob = run(["hash-object", "--stdin-paths"], `${paths.join("\n")}\n`, cwd);
    const ids = (blob?.stdout ?? "").split("\n").filter((line) => line.length > 0);
    if (failed(blob) || ids.length !== paths.length) {
      return { hash, diff: "", error: note(blob) || "cannot hash untracked files" };
    }
    paths.forEach((path, index) => extras.push(stub(path, ids[index])));
  }
  return { hash, repo: cwd || "", diff: keptDiff(tracked.stdout, extras) };
}
