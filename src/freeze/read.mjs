import { spawnSync } from "node:child_process";

const maxBuffer = 32 * 1024 * 1024;

function git(args) {
  return spawnSync("git", args, { encoding: "utf8", maxBuffer });
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

export function readCandidate(run = git) {
  const head = run(["rev-parse", "HEAD"]);
  const hash = head?.status === 0 ? head.stdout.trim() : "";
  const tracked = run(["diff", "HEAD"]);
  const status = run(["status", "--porcelain=v1", "-z", "-uall"]);
  if (!hash || failed(tracked) || failed(status)) {
    const error = [note(tracked), note(status)].filter(Boolean).join("\n");
    return { hash, diff: "", ...(error ? { error } : {}) };
  }
  const extras = [];
  for (const path of untracked(status.stdout)) {
    const blob = run(["hash-object", "--", path]);
    if (failed(blob)) {
      return { hash, diff: "", error: note(blob) || `cannot hash ${path}` };
    }
    extras.push(stub(path, blob.stdout.trim()));
  }
  return {
    hash,
    diff: [(tracked.stdout ?? "").trim(), ...extras].filter(Boolean).join("\n"),
  };
}
