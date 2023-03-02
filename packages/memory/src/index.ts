import { IStore } from "@mmr/core";

export default class MMRInMemoryStore implements IStore {
  private store: Map<string, string>;

  constructor() {
    this.store = new Map();
  }

  async get(key: string): Promise<string | undefined> {
    return this.store.get(key);
  }

  async getMany(keys: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    for (const key of keys) {
      const value = await this.get(key);
      if (value) result.set(key, value);
    }
    return result;
  }

  async set(key: string, value: string): Promise<void> {
    this.store.set(key, value);
  }

  async setMany(entries: Map<string, string>): Promise<void> {
    for (const [key, value] of entries.entries()) {
      await this.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    this.store.delete(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.delete(key);
    }
  }
}
