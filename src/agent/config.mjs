import { readFileSync } from "node:fs";
import { startRun } from "./run.mjs";

export function oneAgent(config) {
  const agents = Array.isArray(config?.agents) ? config.agents : [];
  if (agents.length !== 1 || !agents[0]?.name || !agents[0]?.command) {
    return { started: false, reason: "one agent required" };
  }
  return { name: agents[0].name, command: agents[0].command };
}

export function openConfiguredRun(config, rest) {
  const agent = oneAgent(config);
  if (agent.started === false) return agent;
  return startRun({ ...rest, agent: agent.name, command: agent.command });
}

export function readAgentConfig(path, rest) {
  return openConfiguredRun(JSON.parse(readFileSync(path, "utf8")), rest);
}
