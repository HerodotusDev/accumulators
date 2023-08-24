import { IStore } from "@accumulators/core";
import { verbose, Database } from "sqlite3";
import { promisify } from "util";

export default class SQLiteStore implements IStore {
  private readonly db: Database;
  private run: any;

  constructor(path: string) {
    const sqlite3 = verbose();
    this.db = new sqlite3.Database(path);
    this.run = promisify(this.db.run).bind(this.db);
  }

  async init(): Promise<void> {
    await this.run(`
      CREATE TABLE IF NOT EXISTS store (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);
  }

  async get(key: string): Promise<string> {
    const get = promisify(this.db.get).bind(this.db);
    const result = await get(`SELECT value FROM store WHERE key = '${key}'`);
    return result?.value;
  }

  // TODO: suboptimal
  async getMany(keys: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    for (const key of keys) {
      result.set(key, await this.get(key));
    }
    return result;
  }

  async set(key: string, value: string): Promise<void> {
    await this.run("INSERT INTO store (key, value) VALUES (?, ?)", key, value);
  }

  // TODO: suboptimal
  async setMany(entries: Map<string, string>): Promise<void> {
    for (const [key, value] of entries) {
      await this.set(key, value);
    }
  }

  async delete(key: string): Promise<void> {
    await this.run(`DELETE FROM store WHERE key = '${key}'`);
  }

  // TODO: suboptimal
  async deleteMany(keys: string[]): Promise<void> {
    for (const key of keys) {
      await this.delete(key);
    }
  }
}
