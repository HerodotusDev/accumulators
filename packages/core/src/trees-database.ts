import { IStore } from "./types";

export class InStoreTable {
  private readonly keySplitLength: number;
  constructor(protected readonly store: IStore, public readonly key: string) {
    const keySegments = key.split(":");
    this.keySplitLength = keySegments.length + (keySegments[keySegments.length - 1] === "" ? -1 : 0);
  }

  getFullKey(suffix: string | number): string {
    return this.key + (suffix ?? "").toString() || "";
  }

  async get(suffix?: string | number): Promise<string> {
    return this.store.get(this.getFullKey(suffix));
  }

  async getMany(suffixes: (string | number)[]): Promise<Map<string, string>> {
    const keys = suffixes.map((suffix) => this.getFullKey(suffix));
    const keyless = new Map();

    (await this.store.getMany(keys)).forEach((value, key) =>
      keyless.set(key.split(":").slice(this.keySplitLength).join(":"), value)
    );
    return keyless;
  }

  async set(value: string, suffix?: string | number): Promise<void> {
    return this.store.set(this.getFullKey(suffix), value);
  }

  async setMany(entries: Record<string, string>): Promise<void> {
    const storeEntries = new Map<string, string>();
    for (const key in entries) {
      storeEntries.set(this.getFullKey(key), entries[key]);
    }
    return this.store.setMany(storeEntries);
  }
}

export class InStoreCounter {
  constructor(private readonly store: IStore, public readonly key: string) {}

  async get(): Promise<number> {
    const count = await this.store.get(this.key);
    return count ? parseInt(count) : 0;
  }

  async set(count: number): Promise<void> {
    if (isNaN(count)) throw new Error("Count is not a number");
    await this.store.set(this.key, count.toString());
  }

  async increment(): Promise<number> {
    const count = await this.get();
    const newCount = count + 1;
    await this.set(newCount);
    return newCount;
  }
}
