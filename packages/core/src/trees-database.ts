import { IStore, TREE_METADATA_KEYS } from "./types";
import { v4 as uuid } from "uuid";

export class TreesDatabase {
  mmrUuid: string;

  readonly leavesCount: InStoreCounter;
  readonly elementsCount: InStoreCounter;

  hashes: InStoreTable;
  readonly rootHash: InStoreTable;

  constructor(protected readonly store: IStore, mmrUuid?: string) {
    mmrUuid ? (this.mmrUuid = mmrUuid) : (this.mmrUuid = uuid());
    this.leavesCount = new InStoreCounter(this.store, `${this.mmrUuid}:${TREE_METADATA_KEYS.LEAF_COUNT}`);
    this.elementsCount = new InStoreCounter(this.store, `${this.mmrUuid}:${TREE_METADATA_KEYS.ELEMENT_COUNT}`);
    this.rootHash = new InStoreTable(this.store, `${this.mmrUuid}:${TREE_METADATA_KEYS.ROOT_HASH}`);
    this.hashes = new InStoreTable(this.store, `${this.mmrUuid}:hashes:`);
  }
}

export class InStoreTable {
  constructor(protected readonly store: IStore, protected readonly key: string) {}

  protected getFullKey(suffix: string | number): string {
    return this.key + (suffix ?? "").toString() || "";
  }

  async get(suffix?: string | number): Promise<string> {
    return this.store.get(this.getFullKey(suffix));
  }

  async getMany(suffixes: (string | number)[]): Promise<Map<string, string>> {
    const keys = suffixes.map((suffix) => this.getFullKey(suffix));
    const keyless = new Map();
    (await this.store.getMany(keys)).forEach((value, key) => keyless.set(key.split(":").slice(2).join(":"), value));
    return keyless;
  }

  async set(value: string, suffix?: string | number): Promise<void> {
    return this.store.set(this.getFullKey(suffix), value);
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
