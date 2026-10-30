export class MemoryError extends Error {
  constructor(message, { backend } = {}) {
    super(message);
    this.name = "MemoryError";
    this.backend = backend;
  }
}

export class MemoryPort {
  save() {
    throw new MemoryError("save is not implemented", { backend: this.name });
  }

  search() {
    throw new MemoryError("search is not implemented", { backend: this.name });
  }
}
