import { IStore, InStoreCounter, InStoreTable } from "@accumulators/core";
import { TREE_METADATA_KEYS } from "./types";
import { ulid } from "ulid";

export class TreesDatabase {
  mmrId: string;

  readonly leavesCount: InStoreCounter;
  readonly elementsCount: InStoreCounter;

  hashes: InStoreTable;
  readonly rootHash: InStoreTable;

  constructor(public readonly store: IStore, mmrId?: string) {
    mmrId ? (this.mmrId = mmrId) : (this.mmrId = ulid());
    this.leavesCount = new InStoreCounter(this.store, `${this.mmrId}:${TREE_METADATA_KEYS.LEAF_COUNT}`);
    this.elementsCount = new InStoreCounter(this.store, `${this.mmrId}:${TREE_METADATA_KEYS.ELEMENT_COUNT}`);
    this.rootHash = new InStoreTable(this.store, `${this.mmrId}:${TREE_METADATA_KEYS.ROOT_HASH}`);
    this.hashes = new InStoreTable(this.store, `${this.mmrId}:hashes:`);
  }
}
