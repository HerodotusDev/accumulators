import * as RocksDB from "level-rocksdb";
import { IStore } from "@herodotus_dev/mmr-core";
import { RocksDBType } from "./types";

export default class MMRRocksDBStore implements IStore {
  private db: RocksDBType;

  constructor(location: string) {
    this.db = new RocksDB(location);
  }

  async init(): Promise<void> {
    if (!this.db.isOpen()) await this.db.open({ createIfMissing: true });
  }

  async get(key: string): Promise<string | undefined> {
    if (!this.db.isOperational()) throw new Error("Database not operational");
    const result = await this.db.get(key).catch(() => null);
    if (result === null) return undefined;
    return result;
  }

  async getMany(keys: string[]): Promise<Map<string, string>> {
    if (!this.db.isOperational()) throw new Error("Database not operational");
    const result = new Map<string, string>();
    const values = await this.db.getMany(keys);
    for (let i = 0; i < keys.length; i++) {
      if (values[i] !== null) result.set(keys[i], values[i]);
    }
    return result;
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.db.isOperational()) throw new Error("Database not operational");
    await this.db.put(key, value);
  }

  async setMany(entries: Map<string, string>): Promise<void> {
    if (!this.db.isOperational()) throw new Error("Database not operational");
    const ops = [];
    for (const [key, value] of entries.entries()) {
      ops.push({ type: "put", key, value });
    }
    await this.db.batch(ops);
  }

  async delete(key: string): Promise<void> {
    if (!this.db.isOperational()) throw new Error("Database not operational");
    await this.db.del(key);
  }

  async deleteMany(keys: string[]): Promise<void> {
    if (!this.db.isOperational()) throw new Error("Database not operational");
    const ops = [];
    for (const key of keys) {
      ops.push({ type: "del", key });
    }
    await this.db.batch(ops);
  }
}

export * from "./types";
