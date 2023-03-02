import { CoreMMR, IHasher, IStore } from ".";
import { InStoreTable } from "./trees-database";

export class PrecomputationMMR extends CoreMMR {
  private constructor(
    store: IStore,
    hasher: IHasher,

    parentMmrUuid: string,
    elementsCount: number,
    leavesCount: number,
    rootHash: string,

    mmrUuid?: string
  ) {
    super(store, hasher, mmrUuid);

    this.elementsCount.set(elementsCount);
    this.leavesCount.set(leavesCount);
    this.rootHash.set(rootHash);

    this.hashes = new PrecomputeInStoreTable(store, `${mmrUuid}:hashes:`, `${parentMmrUuid}:hashes:`, elementsCount);
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

    return this.constructor(store, hasher, parentMmrUuid, elementsCount, leavesCount, rootHash, mmrUuid);
  }
}

export class PrecomputeInStoreTable extends InStoreTable {
  constructor(store: IStore, key: string, private readonly parentKey, private readonly parentEndIdx) {
    super(store, key);
  }

  protected getFullKey(idx: number): string {
    if (idx >= this.parentEndIdx) return this.key + idx?.toString() || "";
    else return this.parentKey + idx?.toString() || "";
  }
}
