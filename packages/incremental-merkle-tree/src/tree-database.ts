import { IStore, InStoreTable } from "@accumulators/core";
import { ulid } from "ulid";
import { TREE_METADATA_KEYS } from "./metadata";

export class TreeDatabase {
  treeId: string;

  nodes: InStoreTable;
  readonly rootHash: InStoreTable;

  constructor(protected readonly store: IStore, treeId?: string) {
    treeId ? (this.treeId = treeId) : (this.treeId = ulid());
    this.rootHash = new InStoreTable(this.store, `${this.treeId}:${TREE_METADATA_KEYS.ROOT_HASH}`);
    this.nodes = new InStoreTable(this.store, `${this.treeId}:nodes:`);
  }
}
