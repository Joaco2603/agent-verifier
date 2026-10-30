import { spawnSync } from "node:child_process";
import { report } from "./report.mjs";

export function runOnce(argv) {
  const proc = spawnSync(argv[0], argv.slice(1), { encoding: "utf8" });
  return { status: proc.status ?? 1, stdout: proc.stdout ?? "" };
}

export function replay(argv) {
  const first = runOnce(argv);
  const second = runOnce(argv);
  return {
    same: first.status === second.status && first.stdout === second.stdout,
    first,
    second,
  };
}

export function withReplay(stored, replayed) {
  if (replayed.same) return report(stored);
  const checks = (stored.checks ?? []).map((check) => (
    check.id === stored.commandCheck
      ? { id: check.id, state: "UNKNOWN", evidence: null, reason: "replay differed" }
      : check
  ));
  return report({ ...stored, checks });
}
