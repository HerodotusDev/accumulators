import { IStore, TREE_METADATA_KEYS } from "./types";
import { v4 as uuid } from "uuid";

export class TreesDatabase {
  private mmrUuid: string;

  protected readonly leavesCount: InStoreCounter;
  protected readonly elementsCount: InStoreCounter;

  protected readonly hashes: InStoreTable;
  protected readonly rootHash: InStoreTable;

  constructor(private readonly store: IStore, mmrUuid?: string) {
    mmrUuid ? (this.mmrUuid = mmrUuid) : (this.mmrUuid = uuid());
    this.leavesCount = new InStoreCounter(this.store, `${this.mmrUuid}:${TREE_METADATA_KEYS.LEAF_COUNT}`);
    this.elementsCount = new InStoreCounter(this.store, `${this.mmrUuid}:${TREE_METADATA_KEYS.ELEMENT_COUNT}`);
    this.rootHash = new InStoreTable(this.store, `${this.mmrUuid}:${TREE_METADATA_KEYS.ROOT_HASH}`);
    this.hashes = new InStoreTable(this.store, `${this.mmrUuid}:hashes:`);
  }
}

export class InStoreTable {
  constructor(private readonly store: IStore, private readonly key: string) {}

  async get(suffix?: string | number): Promise<string> {
    suffix = suffix?.toString() || "";
    return this.store.get(this.key + suffix);
  }

  async getMany(suffixes: (string | number)[]): Promise<Map<string, string>> {
    const keys = suffixes.map((suffix) => this.key + suffix.toString());
    return this.store.getMany(keys);
  }

  async set(value: string, suffix?: string | number): Promise<void> {
    suffix = suffix?.toString() || "";
    return this.store.set(this.key + suffix, value);
  }
}

export class InStoreCounter {
  constructor(private readonly store: IStore, private readonly key: string) {}

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
