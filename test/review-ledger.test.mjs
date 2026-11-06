import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { alarm, done, openStart, readLog, report, start } from "../src/review/ledger.mjs";

const log = () => join(mkdtempSync(join(tmpdir(), "review-")), "log.jsonl");
const MINUTE = 60_000;

test("minutes come from the clock between start and done", () => {
  const file = log();
  start(file, { id: "A-1", by: "ana", kind: "human" }, 1_000_000);
  const entry = done(file, { id: "A-1", verdict: "approve" }, 1_000_000 + 7.5 * MINUTE);
  assert.equal(entry.minutes, 7.5);
  assert.equal(entry.by, "ana");
  assert.equal(readLog(file).length, 2);
});

test("done needs a start, and a second start needs the first one closed", () => {
  const file = log();
  assert.throws(() => done(file, { id: "A-1", verdict: "approve" }), /no review in progress/);
  start(file, { id: "A-1", by: "ana", kind: "human" });
  assert.throws(() => start(file, { id: "A-1", by: "ana", kind: "human" }), /already has a review in progress/);
  done(file, { id: "A-1", verdict: "reject" });
  assert.equal(openStart(readLog(file), "A-1"), null);
  start(file, { id: "A-1", by: "ana", kind: "human" });
});

test("kind, verdict, judgement and a note are checked", () => {
  const file = log();
  assert.throws(() => start(file, { id: "A-1", by: "ana", kind: "robot" }), /kind must be one of/);
  start(file, { id: "A-1", by: "ana", kind: "human" });
  assert.throws(() => done(file, { id: "A-1", verdict: "maybe" }), /verdict must be one of/);
  assert.throws(() => alarm(file, { id: "A-1", by: "ana", kind: "human", judgement: "meh", note: "x" }), /judgement must be one of/);
  assert.throws(() => alarm(file, { id: "A-1", by: "ana", kind: "human", judgement: "defect", note: "  " }), /note is required/);
});

test("the gate takes human entries only", () => {
  const file = log();
  for (const [id, kind, minutes] of [["A-1", "human", 10], ["A-2", "human", 20], ["A-1", "claude", 0.1], ["A-2", "subagent", 0.1]]) {
    start(file, { id, by: "r", kind }, 0);
    done(file, { id, verdict: "approve" }, minutes * MINUTE);
  }
  const result = report(readLog(file), ["A-1", "A-2"]);
  assert.equal(result.gate.approvalMinutes.median, 15);
  assert.equal(result.byKind.claude.medianMinutes, 0.1);
  assert.equal(result.byKind.subagent.reviewed, 1);
});

test("a partial human run leaves the gate numbers null", () => {
  const file = log();
  start(file, { id: "A-1", by: "ana", kind: "human" }, 0);
  done(file, { id: "A-1", verdict: "approve" }, 5 * MINUTE);
  const result = report(readLog(file), ["A-1", "A-2"], ["A-1", "A-2"]);
  assert.equal(result.gate.approvalMinutes.reviewed, "1/2");
  assert.equal(result.gate.approvalMinutes.median, null);
  assert.equal(result.gate.falseAlarms.count, null);
});

test("false alarms count only when a human judged every FAIL", () => {
  const file = log();
  alarm(file, { id: "A-1", by: "ana", kind: "human", judgement: "false_alarm", note: "renamed field only" });
  alarm(file, { id: "A-2", by: "bo", kind: "claude", judgement: "defect", note: "wrong total" });
  let result = report(readLog(file), ["A-1", "A-2"], ["A-1", "A-2"]);
  assert.equal(result.gate.falseAlarms.judged, "1/2");
  assert.equal(result.gate.falseAlarms.count, null);
  alarm(file, { id: "A-2", by: "ana", kind: "human", judgement: "defect", note: "wrong total" });
  result = report(readLog(file), ["A-1", "A-2"], ["A-1", "A-2"]);
  assert.equal(result.gate.falseAlarms.count, 1);
  assert.equal(result.byKind.claude.alarms.defect, 1);
});

test("the latest judgement for a contract replaces the earlier one", () => {
  const file = log();
  alarm(file, { id: "A-1", by: "ana", kind: "human", judgement: "false_alarm", note: "first read" });
  alarm(file, { id: "A-1", by: "ana", kind: "human", judgement: "defect", note: "second read" });
  assert.equal(report(readLog(file), ["A-1"], ["A-1"]).gate.falseAlarms.count, 0);
});

test("the command line times a review and lists the FAILs to read", () => {
  const dir = mkdtempSync(join(tmpdir(), "review-cli-"));
  writeFileSync(join(dir, "A-1.yaml"), "id: A-1\ntarget:\n  operation: f\n  inputs: [x]\ncases:\n  - id: c\n    input: { x: 1 }\n    expected: { y: 2 }\nproperties: []\n");
  writeFileSync(join(dir, "A-1.txt"), "Double the input.\n");
  writeFileSync(join(dir, "wrong.mjs"), "export const functions = { 'A-1': ({ x }) => ({ y: x + 2 }) };\n");
  const logFile = join(dir, "log.jsonl");
  const run = (...args) => spawnSync(process.execPath, ["src/review/cli.mjs", ...args, "--log", logFile], { encoding: "utf8" });
  assert.equal(run("start", "A-1", "--by", "ana", "--kind", "human").status, 0);
  const finished = run("done", "A-1", "--verdict", "reject");
  assert.equal(finished.status, 0);
  assert.match(finished.stdout, /A-1: reject after \d+\.\d+ minutes by ana \(human\)/);
  const queue = run("queue", "--contracts", dir, "--functions", join(dir, "wrong.mjs"), "--sentences", dir);
  assert.match(queue.stdout, /A-1 — Double the input\./);
  assert.match(queue.stdout, /y: wanted 2, got 3/);
  assert.equal(run("start", "A-1", "--by", "ana", "--kind", "robot").status, 2);
  assert.equal(run("nothing").status, 2);
});
