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

  async getMany(keys: string[]): Promise<Map<string, string>> {
    const result = new Map<string, string>();
    if (keys.length === 0) return result;
    let query = "SELECT * FROM store WHERE key IN (";

    for (const key of keys) {
      query += `'${key}', `;
    }

    query = query.slice(0, -2) + ");";

    const all = promisify(this.db.all).bind(this.db);
    const rows = await all(query);

    for (const row of rows) {
      result.set(row.key, row.value);
    }
    return result;
  }

  async set(key: string, value: string): Promise<void> {
    await this.run("INSERT OR REPLACE INTO store (key, value) VALUES (?, ?)", key, value);
  }

  async setMany(entries: Map<string, string>): Promise<void> {
    let query = "INSERT OR REPLACE INTO store (key, value) VALUES ";

    for (const [key, value] of entries) {
      query += `('${key}', '${value}'), `;
    }
    query = query.slice(0, -2) + ";";

    await this.run(query);
  }

  async delete(key: string): Promise<void> {
    await this.run(`DELETE FROM store WHERE key = '${key}'`);
  }

  async deleteMany(keys: string[]): Promise<void> {
    let query = "DELETE FROM store WHERE key IN (";

    for (const key of keys) {
      query += `'${key}', `;
    }
    query = query.slice(0, -2) + ");";

    await this.run(query);
  }
}
