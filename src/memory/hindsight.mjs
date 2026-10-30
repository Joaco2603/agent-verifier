import { MemoryError, MemoryPort } from "./port.mjs";

const MISSING = "Hindsight is not connected. Pass recall and retain, or set MEMORY_BACKEND=engram.";

export class HindsightMemory extends MemoryPort {
  constructor({ recall, retain } = {}) {
    super();
    this.name = "hindsight";
    this.recall = recall;
    this.retain = retain;
  }

  save({ title, body, type = "decision" }) {
    if (!this.retain) throw new MemoryError(MISSING, { backend: this.name });
    if (!title || !body) throw new MemoryError("title and body are required", { backend: this.name });
    return this.retain({ title, body, type });
  }

  search(query, options = {}) {
    if (!this.recall) throw new MemoryError(MISSING, { backend: this.name });
    return this.recall(query, options);
  }
}
