import { EngramMemory } from "./engram.mjs";
import { HindsightMemory } from "./hindsight.mjs";
import { MemoryError } from "./port.mjs";

export function openMemory(env = process.env, injected = {}) {
  const backend = env.MEMORY_BACKEND ?? "engram";
  if (backend === "engram") {
    return new EngramMemory({
      project: env.MEMORY_PROJECT ?? "ai-skill-reviewer",
      env,
      ...injected.engram,
    });
  }
  if (backend === "hindsight") {
    return new HindsightMemory(injected.hindsight ?? {});
  }
  throw new MemoryError(`Unknown memory backend: ${backend}`, { backend });
}
