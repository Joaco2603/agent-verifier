import { spawnSync } from "node:child_process";

function git(args) {
  return spawnSync("git", args, { encoding: "utf8" });
}

function header(path) {
  return `diff --git a/${path} b/${path}\n--- /dev/null\n+++ b/${path}`;
}

export function readCandidate(run = git) {
  const head = run(["rev-parse", "HEAD"]);
  const tracked = run(["diff", "HEAD"]);
  const status = run(["status", "--porcelain"]);
  if (head.status !== 0 || tracked.status !== 0 || status.status !== 0) {
    return { hash: "", diff: "" };
  }
  const seen = tracked.stdout ?? "";
  const extra = (status.stdout ?? "")
    .split("\n")
    .filter((line) => line.startsWith("?? "))
    .map((line) => line.slice(3).trim())
    .filter((path) => path && !seen.includes(path))
    .map(header);
  return {
    hash: head.stdout.trim(),
    diff: [seen.trim(), ...extra].filter(Boolean).join("\n"),
  };
}
