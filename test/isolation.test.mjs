import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import test from "node:test";
import { beginRun } from "../src/isolation/run.mjs";

const ready = {
  boundary: "temp-copy",
  allowList: ["src/pay.js"],
  networkDefault: false,
  grants: { network: [] },
  secrets: ["sk-live"],
  prompt: "use sk-live",
  action: { path: "src/pay.js" },
};

test("a run does not start until isolation and an allow-list are recorded", () => {
  let spawned = false;
  const result = beginRun({ ...ready, boundary: null }, () => {
    spawned = true;
  });
  assert.equal(spawned, false);
  assert.equal(result.state, "FAIL");
  assert.equal(result.reason, "isolation not recorded");
});

test("a denied action is started and then killed", async () => {
  const killed = [];
  const spawnChild = () => ({ pid: 42 });
  const network = beginRun({ ...ready, action: { network: "example.com" } }, spawnChild, (pid) => {
    killed.push(pid);
  });
  const outside = beginRun({ ...ready, action: { path: "secrets/key" } }, spawnChild, (pid) => {
    killed.push(pid);
  });
  const contracts = beginRun({ ...ready, allowList: ["contracts/RF-01.yaml"], action: { path: "contracts/RF-01.yaml" } }, spawnChild, (pid) => {
    killed.push(pid);
  });
  assert.deepEqual(killed, [42, 42, 42]);
  assert.equal(network.killed, true);
  assert.equal(network.state, "FAIL");
  assert.equal(network.reason, "network denied");
  assert.equal(outside.reason, "path denied");
  assert.equal(contracts.reason, "path denied");

  const child = spawn(process.execPath, ["-e", "setInterval(() => {}, 1000)"], { stdio: "ignore" });
  try {
    const live = beginRun({ ...ready, action: { path: "secrets/key" } }, () => child);
    assert.equal(live.killed, true);
    assert.equal(live.pid, child.pid);
    await new Promise((resolve) => child.once("exit", resolve));
    assert.equal(child.signalCode, "SIGTERM");
  } finally {
    if (child.exitCode === null && child.signalCode === null) child.kill();
  }
});

test("the prompt log withholds the secret and a score does not clear a security FAIL", () => {
  const result = beginRun({
    ...ready,
    score: 0,
    route: "other-model",
    security: { state: "FAIL", finding: "auth missing" },
  });
  assert.equal(result.promptLog.includes("sk-live"), false);
  assert.equal(result.promptLog.includes("[withheld]"), true);
  assert.equal(result.state, "FAIL");
  assert.equal(result.block, true);
  assert.equal(result.score, 0);
});
