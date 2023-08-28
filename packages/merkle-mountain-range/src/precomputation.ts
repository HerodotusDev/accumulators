import { IHasher, IStore, InStoreTable } from "@accumulators/core";
import CoreMMR from ".";

/**
 * @deprecated Use DraftMMR instead.
 */
export class PrecomputationMMR extends CoreMMR {
  private readonly parentEndIdx: number;
  private constructor(
    store: IStore,
    hasher: IHasher,

    parentmmrId: string,
    elementsCount: number,

    mmrId?: string
  ) {
    super(store, hasher, mmrId);

    this.hashes = new PrecomputeInStoreTable(store, `${this.mmrId}:hashes:`, `${parentmmrId}:hashes:`, elementsCount);
    this.parentEndIdx = elementsCount;
  }

  static async initialize(
    store: IStore,
    hasher: IHasher,
    parentmmrId: string,
    mmrId?: string
  ): Promise<PrecomputationMMR> {
    const parentMmr = new CoreMMR(store, hasher, parentmmrId);
    const elementsCount = await parentMmr.elementsCount.get();
    const leavesCount = await parentMmr.leavesCount.get();
    const rootHash = await parentMmr.rootHash.get();
    const precomputationMMR = new PrecomputationMMR(store, hasher, parentmmrId, elementsCount, mmrId);

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
