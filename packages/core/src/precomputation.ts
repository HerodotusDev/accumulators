import CoreMMR, { IHasher, IStore } from ".";
import { InStoreTable } from "./trees-database";

export class PrecomputationMMR extends CoreMMR {
  private readonly parentEndIdx: number;
  private constructor(
    store: IStore,
    hasher: IHasher,

    parentMmrUuid: string,
    elementsCount: number,

    mmrUuid?: string
  ) {
    super(store, hasher, mmrUuid);

    this.hashes = new PrecomputeInStoreTable(
      store,
      `${this.mmrUuid}:hashes:`,
      `${parentMmrUuid}:hashes:`,
      elementsCount
    );
    this.parentEndIdx = elementsCount;
  }

  static async initialize(
    store: IStore,
    hasher: IHasher,
    parentMmrUuid: string,
    mmrUuid?: string
  ): Promise<PrecomputationMMR> {
    const parentMmr = new CoreMMR(store, hasher, parentMmrUuid);
    const elementsCount = await parentMmr.elementsCount.get();
    const leavesCount = await parentMmr.leavesCount.get();
    const rootHash = await parentMmr.rootHash.get();
    const precomputationMMR = new PrecomputationMMR(store, hasher, parentMmrUuid, elementsCount, mmrUuid);

    await precomputationMMR.elementsCount.set(elementsCount);
    await precomputationMMR.leavesCount.set(leavesCount);
    if (rootHash) await precomputationMMR.rootHash.set(rootHash);

    return precomputationMMR;
  }

  async close(): Promise<void> {
    await this.clear();
  }

  async clear() {
    const toDelete = [this.elementsCount.key, this.rootHash.key, this.leavesCount.key];
    const elementsCount = await this.elementsCount.get();

    const hashes = Array.from({ length: elementsCount - this.parentEndIdx }, (_, i) => i + this.parentEndIdx + 1).map(
      (idx) => this.hashes.getFullKey(idx)
    );
    return this.store.deleteMany(toDelete.concat(hashes));
  }
}

export class PrecomputeInStoreTable extends InStoreTable {
  constructor(store: IStore, key: string, private readonly parentKey, private readonly parentEndIdx) {
    super(store, key);
  }

  getFullKey(idx?: number): string {
    return idx > this.parentEndIdx
      ? this.key + (idx ?? "").toString() || ""
      : this.parentKey + (idx ?? "").toString() || "";
  }
}
