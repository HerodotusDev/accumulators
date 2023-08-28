import { IHasher, IStore, InStoreTable } from "@accumulators/core";
import CoreMMR from ".";

/**
 * DraftMMR is an extension of CoreMMR, that allows for separate "draft" MMR changes to be applied to the parent MMR.
 * If the changes are satisfactory you can do .apply() to apply the changes to the parent MMR.
 * If the changes are not satisfactory you can do .clear() to discard the changes.
 *
 * Use this instead of the deprecated PrecomputationMMR.
 */
export class DraftMMR extends CoreMMR {
  private readonly parentMmr: CoreMMR;
  private readonly parentEndIdx: number;
  private constructor(store: IStore, hasher: IHasher, parentMmr: CoreMMR, elementsCount: number, mmrId?: string) {
    super(store, hasher, mmrId);

    this.hashes = new DraftTable(store, `${this.mmrId}:hashes:`, parentMmr.hashes, elementsCount);
    this.parentMmr = parentMmr;
    this.parentEndIdx = elementsCount;
  }

  static async initialize(store: IStore, hasher: IHasher, parentMmr: CoreMMR, mmrId?: string): Promise<DraftMMR> {
    const elementsCount = await parentMmr.elementsCount.get();
    const leavesCount = await parentMmr.leavesCount.get();
    const rootHash = await parentMmr.rootHash.get();
    const draftMMR = new DraftMMR(store, hasher, parentMmr, elementsCount, mmrId);

    await draftMMR.elementsCount.set(elementsCount);
    await draftMMR.leavesCount.set(leavesCount);
    if (rootHash) await draftMMR.rootHash.set(rootHash);

    return draftMMR;
  }

  async clear() {
    const toDelete = [this.elementsCount.key, this.rootHash.key, this.leavesCount.key, ...(await this.getAllKeys())];
    return this.store.deleteMany(toDelete);
  }

  async discard() {
    await this.clear();
  }

  async apply({ clear = true } = { clear: true }) {
    const allKeys = await this.getAllKeys();

    const toSet = new Map();
    toSet.set(this.parentMmr.elementsCount.key, await this.elementsCount.get());
    toSet.set(this.parentMmr.rootHash.key, await this.rootHash.get());
    toSet.set(this.parentMmr.leavesCount.key, await this.leavesCount.get());

    const allHashes = await this.getAllHashes(allKeys);
    Object.entries(allHashes).forEach(([key, value]) => {
      const newKey = key.split(":");
      newKey[0] = this.parentMmr.mmrId;
      return toSet.set(newKey.join(":"), value);
    });

    //? Apply the changes to the parent MMR
    await this.parentMmr.store.setMany(toSet);

    if (!clear) return; //? Optional clearing of the draft MMR on apply
    const toDelete = [this.elementsCount.key, this.rootHash.key, this.leavesCount.key, ...allKeys];
    await this.store.deleteMany(toDelete);
  }

  async getAllKeys(): Promise<string[]> {
    const elementsCount = await this.elementsCount.get();
    const keys = Array.from({ length: elementsCount - this.parentEndIdx }, (_, i) => i + this.parentEndIdx + 1).map(
      (idx) => this.hashes.getFullKey(idx)
    );
    return keys;
  }

  async getAllHashes(keys: string[]): Promise<Record<string, string>> {
    const hashes = await this.store.getMany(keys);
    return Object.fromEntries(hashes);
  }
}

export class DraftTable extends InStoreTable {
  constructor(store: IStore, key: string, private readonly parentTable: InStoreTable, private readonly parentEndIdx) {
    super(store, key);
  }

  agnosticGetTable(idx?: number): InStoreTable {
    return idx > this.parentEndIdx ? this : this.parentTable;
  }

  agnosticGetKey(idx: number): string {
    const table = this.agnosticGetTable(idx);
    return table.getFullKey(idx);
  }

  async get(idx?: number): Promise<string> {
    const table = this.agnosticGetTable(idx);
    return table.store.get(table.getFullKey(idx));
  }

  async getMany(idxs: number[]): Promise<Map<string, string>> {
    const keys = idxs.map((suffix) => this.agnosticGetKey(suffix));
    const [thisTable, parentTable] = keys.reduce(
      ([thisTable, parentTable], key) => {
        if (key.startsWith(this.key)) thisTable.push(key);
        else parentTable.push(key);
        return [thisTable, parentTable];
      },
      [[], []] as [string[], string[]]
    );

    const keyless = (
      (await Promise.all([
        thisTable.length ? this.store.getMany(thisTable) : Promise.resolve(new Map()),
        parentTable.length ? this.parentTable.store.getMany(parentTable) : Promise.resolve(new Map()),
      ])) as [Map<string, string>, Map<string, string>]
    )
      .reduce((acc, map) => [...acc, ...map], [] as [string, string][])
      .reduce((acc, [key, value]) => acc.set(key.split(":").slice(2).join(":"), value), new Map<string, string>());

    return keyless;
  }

  async set(value: string, idx?: number): Promise<void> {
    const table = this.agnosticGetTable(idx);
    return table.store.set(table.getFullKey(idx), value);
  }

  async setMany(entries: Record<number, string>): Promise<void> {
    const keyValues = Object.entries(entries).map(([key, value]) => [this.agnosticGetKey(parseInt(key)), value]);

    const [thisTable, parentTable] = keyValues.reduce(
      ([thisTable, parentTable], [key, value]) => {
        (key.startsWith(this.key) ? thisTable : parentTable).set(key, value);
        return [thisTable, parentTable];
      },
      [new Map<string, string>(), new Map<string, string>()]
    );

    await Promise.all([
      thisTable.size ? this.store.setMany(thisTable) : Promise.resolve(),
      parentTable.size ? this.parentTable.store.setMany(parentTable) : Promise.resolve(),
    ]);
  }
}
