import { readFileSync } from "node:fs";

const contractMarkers = ["approval:", "bounded_output", "expected:", "observables:"];

export function agentPrompt(sentence) {
  const text = String(sentence ?? "").trim();
  if (!text || contractMarkers.some((marker) => text.includes(marker))) {
    throw new Error("prompt contains the contract");
  }
  return text;
}

export function agentPromptFile(path) {
  return agentPrompt(readFileSync(path, "utf8"));
}
