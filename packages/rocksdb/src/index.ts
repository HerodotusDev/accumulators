import { IStore, TREE_METADATA_KEYS } from "@merkle-mountain-range/core";
import * as RocksDB from "level-rocksdb";

type RocksOperationType = "put" | "del";
type RocksGetResult = string | null;

interface RocksDBType {
  new (location: string, options?: { createIfMissing: boolean }): RocksDBType;

  isOpen(): boolean;

  isOperational(): boolean;

  open(options?: { createIfMissing: boolean }): Promise<void>;

  close(): Promise<void>;

  get(key: string): Promise<RocksGetResult>;

  getMany(keys: string[]): Promise<Array<RocksGetResult>>;

  put(key: string, value: string): Promise<void>;

  del(key: string): Promise<void>;

  batch(ops: Array<{ type: RocksOperationType; key: string; value?: string }>): Promise<void>;
}

export class MMRRocksDBStore implements IStore {
  private db: RocksDBType;

  constructor(location: string) {
    this.db = new RocksDB(location);
  }

  async init(reset = false): Promise<void> {
    if (!this.db.isOpen()) await this.db.open({ createIfMissing: true });
    if (reset) {
      await this.set(TREE_METADATA_KEYS.ELEMENT_COUNT, "0");
      await this.set(TREE_METADATA_KEYS.LEAF_COUNT, "0");
      await this.set(TREE_METADATA_KEYS.ROOT_HASH, "");
    }
  }

  async get(key: string): Promise<string | undefined> {
    if (!this.db.isOperational()) throw new Error("Database not operational");
    const result = await this.db.get(key);
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
