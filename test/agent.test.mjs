import assert from "node:assert/strict";
import test from "node:test";
import { attempt, startRun } from "../src/agent/run.mjs";
import { oneAgent, readAgentConfig } from "../src/agent/config.mjs";

function configured(agent) {
  return startRun({
    agent,
    command: "agent",
    allowList: ["src/pay.js"],
    contractHash: "hash-1",
    criticalTests: { "test/pay.test.js": "approved-test" },
  });
}

test("a missing agent refuses to start and the same boundary fits each agent name", () => {
  assert.equal(startRun({ command: "agent" }).started, false);
  for (const agent of ["Codex", "Claude Code", "Cursor"]) {
    const run = configured(agent);
    assert.equal(run.agent, agent);
    assert.equal(run.contractHash, "hash-1");
    assert.deepEqual(run.allowList, ["src/pay.js"]);
  }
});

test("an inside write is kept, an outside write is rejected, and the verification copy is independent", () => {
  const run = configured("Cursor");
  const result = attempt(run, [
    { path: "src/pay.js", before: "a", after: "b" },
    { path: "src/other.js", before: "a", after: "b" },
  ], { attempt: 1 });
  assert.equal(result.log.length, 1);
  assert.equal(result.log[0].agent, "Cursor");
  assert.deepEqual(result.rejected, ["src/other.js"]);
  result.verificationCopy[0].after = "mutated";
  assert.equal(result.log[0].after, "b");
});

test("attempt 3 does not start, and both attempts keep the contract hash", () => {
  const run = configured("Cursor");
  const first = attempt(run, [{ path: "src/pay.js", before: "a", after: "b" }], { attempt: 1, failed: true });
  const second = attempt(run, [{ path: "src/pay.js", before: "b", after: "c" }], { attempt: 2, failed: true });
  const third = attempt(run, [], { attempt: 3, failed: true });
  assert.equal(first.contractHash, second.contractHash);
  assert.deepEqual(first.allowList, second.allowList);
  assert.equal(second.status, "failed");
  assert.equal(third.started, false);
  assert.equal(third.cost.model, "unknown");
});

test("a contract edit, a critical-test edit, an agent switch, and an unlogged change block", () => {
  const run = configured("Cursor");
  const contract = attempt(run, [{ path: "contracts/RF-01.yaml", before: "a", after: "b" }], { attempt: 1 });
  const critical = attempt(configured("Cursor"), [{ path: "test/pay.test.js", before: "approved-test", after: "rewritten" }], { attempt: 1 });
  const switched = attempt(configured("Cursor"), [], { attempt: 1, agent: "Codex" });
  const unlogged = attempt(configured("Cursor"), [], { attempt: 1, changed: ["src/pay.js"] });
  assert.equal(contract.reason, "contract edited");
  assert.equal(contract.contractHash, "hash-1");
  assert.equal(critical.reason, "critical test edited");
  assert.equal(switched.reason, "agent switched");
  assert.equal(unlogged.reason, "unlogged change");
});

test("phase 1 configures exactly one agent", () => {
  assert.equal(oneAgent({ agents: [] }).reason, "one agent required");
  assert.equal(oneAgent({ agents: [{ name: "Cursor", command: "cursor" }, { name: "Codex", command: "codex" }] }).reason, "one agent required");
  const run = readAgentConfig("config/agent.json", {
    allowList: ["src/pay.js"],
    contractHash: "hash-1",
  });
  assert.equal(run.started, true);
  assert.equal(run.agent, "Cursor");
  assert.equal(run.command, "cursor");
  assert.equal(run.contractHash, "hash-1");
});
