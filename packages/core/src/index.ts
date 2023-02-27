import { AppendResult, IHasher, IStore } from "./types";
import { v4 as uuid } from "uuid";
import { getHeight, parentOffset, siblingOffset } from "./helpers";

export class CoreMMR {
  static TREE_METADATA_KEYS = {
    LEAF_COUNT: "leaf_count",
    ROOT_HASH: "root_hash",
  };

  private treeUuid: string;

  constructor(private readonly store: IStore, private readonly hasher: IHasher, treeUuid?: string) {
    treeUuid ? (this.treeUuid = treeUuid) : (this.treeUuid = uuid());
  }

  async incrementLeafCount(): Promise<number> {
    const leafCount = await this.getLeafCount();
    const newLeafCount = leafCount + 1;
    await this.store.set(CoreMMR.TREE_METADATA_KEYS.LEAF_COUNT, newLeafCount.toString());
    return newLeafCount;
  }

  async getLeafCount(): Promise<number> {
    const leafCount = await this.store.get(CoreMMR.TREE_METADATA_KEYS.LEAF_COUNT);
    return leafCount ? parseInt(leafCount) : 0;
  }

  // async append(value: string): Promise<AppendResult> {
  //   if (!this.hasher.isElementSizeValid(value)) {
  //     throw new Error("Element size is invalid");
  //   }
  //   let leafCount = await this.getLeafCount();
  //   const leafIdx = leafCount.toString();
  //   const hash = this.hasher.hash([leafIdx, value]);

  //   await this.store.set(`${this.treeUuid}:hashes:${leafIdx}`, hash);
  //   await this.store.set(`${this.treeUuid}:values:${leafIdx}`, value);

  //   let height = 0;

  //   while (getHeight(leafCount + 1) > height) {
  //     ++leafCount;

  //     const left = leafCount - parentOffset(height);
  //     const right = left + siblingOffset(height);

  //     const leftHash = await this.store.get(`${this.treeUuid}:hashes:${left.toString()}`);
  //     const rightHash = await this.store.get(`${this.treeUuid}:hashes:${right.toString()}`);

  //     const parentHash = this.hasher.hash([leafCount.toString(), this.hasher.hash([leftHash, rightHash])]);
  //     await this.store.set(`hashes:${leafCount}`, parentHash);

  //     height++;
  //   }

  //   // Update latest value.
  //   await this.store.set(CoreMMR.TREE_METADATA_KEYS.LEAF_COUNT, leafCount.toString());

  //   // Compute the new root hash
  //   let rootHash;
  //   if (this.withRootHash) {
  //       rootHash = await this.bagThePeaks();
  //       await this.dbSet('rootHash', rootHash);
  //   }

  //   const leaves = await this.dbIncr('leaves');
  //   // Returns the new total number of leaves.
  //   return {
  //       leavesCount: leaves,
  //       leafIdx,
  //       rootHash,
  //       lastPos, // Tree size
  //   };
  // }
}
