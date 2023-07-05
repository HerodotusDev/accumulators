import { IStore, IHasher } from "@accumulators/core";
// import CoreMMR from "@accumulators/merkle-mountain-range";
import CoreMMR from "../../merkle-mountain-range/src";
// import { IncrementalMerkleTree } from "@accumulators/incremental-merkle-tree";
// TODO: change import
import { IncrementalMerkleTree } from "../../incremental-merkle-tree/src";
import MemoryStore from "@accumulators/memory"; // TODO: remove
import { StarkPoseidonHasher } from "@accumulators/hashers"; // TODO: remove
import { ulid } from "ulid";

export type UpdateResult = {
  mmrRoot: string;
  region: {
    account: string;
    from: number;
    to: number;
    hash: string;
  };
};

export enum BTREE_METADATA_KEYS {
  MMR_LEAF_INDEX = "mmr-leaf-index",
  PAGES = "pages",
  MAIN_TREE = "main",
  REGION_TO_TREE = "region",
}

interface ILogger {
  log(...args: any[]): void;
}

class ConsoleLogger implements ILogger {
  log(...args: any[]) {
    console.log(...args);
  }
}

export class BTree {
  private mmr: CoreMMR;

  constructor(
    protected readonly store: IStore,
    protected readonly hasher: IHasher,
    protected readonly NULL_VALUE: string,
    protected readonly CHAIN_ID: number = 1,
    protected readonly PAGE_SIZE: number = 8,
    protected readonly logger?: ILogger, // TODO: add logger
    public readonly treeId: string = ulid()
  ) {
    this.mmr = new CoreMMR(store, hasher, `${this.treeId}:${BTREE_METADATA_KEYS.MAIN_TREE}`);
  }

  private getPageAndIndex(blockNumber: number): { pageRange: string; offset: number } {
    const pageIndex = Math.floor(blockNumber / this.PAGE_SIZE);
    const pageBegin = pageIndex * this.PAGE_SIZE;
    const pageEnd = pageBegin + this.PAGE_SIZE - 1;
    const pageRange = `${pageBegin}-${pageEnd}`;
    return { pageRange, offset: blockNumber % this.PAGE_SIZE };
  }

  private computeRegionCommittment(pageName: string, account: string, rootHash: string) {
    const [pageBegin, pageEnd] = pageName.split("-");
    return [
      `0x${parseInt(pageBegin).toString(16)}`,
      `0x${parseInt(pageEnd).toString(16)}`,
      account,
      `${this.CHAIN_ID}`,
      rootHash,
    ].reduce((acc, val) => this.hasher.hash([acc, val]));
  }

  getRootHash() {
    return this.mmr.rootHash.get();
  }

  async update(account: string, index: number, value: string): Promise<UpdateResult> {
    const { pageRange, offset } = this.getPageAndIndex(index);

    const pageMerkleTreeId = await this.store.get(
      `${this.treeId}:${BTREE_METADATA_KEYS.REGION_TO_TREE}:${account}:${pageRange}`
    );

    let rootHash: string;
    let regionCommittment: string;
    if (pageMerkleTreeId === undefined) {
      // create new merkle tree
      const newMerkleTree = await IncrementalMerkleTree.initialize(
        this.PAGE_SIZE,
        this.NULL_VALUE,
        this.hasher,
        this.store,
        `${this.treeId}:${BTREE_METADATA_KEYS.PAGES}:${ulid()}`
      );
      const merkleRootHash = await newMerkleTree.updateAuthenticated(offset, value);
      regionCommittment = this.computeRegionCommittment(pageRange, account, merkleRootHash);

      // add to mmr
      // TODO: add to mmr in batch
      const appendResult = await this.mmr.append(regionCommittment);
      rootHash = appendResult.rootHash;
      await this.store.set(
        `${newMerkleTree.treeId}:${BTREE_METADATA_KEYS.MMR_LEAF_INDEX}`,
        `${appendResult.leafIndex}`
      );
      await this.store.set(
        `${this.treeId}:${BTREE_METADATA_KEYS.REGION_TO_TREE}:${account}:${pageRange}`,
        `${newMerkleTree.treeId}`
      );
    } else {
      // reconstruct existing merkle tree from memory
      const merkleTree = new IncrementalMerkleTree(
        this.PAGE_SIZE,
        this.NULL_VALUE,
        this.hasher,
        this.store,
        pageMerkleTreeId
      );
      const merkleRootHash = await merkleTree.updateAuthenticated(offset, value);
      regionCommittment = this.computeRegionCommittment(pageRange, account, merkleRootHash);

      // update mmr
      const leafIndex = parseInt(await this.store.get(`${pageMerkleTreeId}:${BTREE_METADATA_KEYS.MMR_LEAF_INDEX}`));
      rootHash = await this.mmr.update(leafIndex, regionCommittment);
    }

    const [from, to] = pageRange.split("-");
    return {
      mmrRoot: rootHash,
      region: {
        account,
        from: parseInt(from),
        to: parseInt(to),
        hash: regionCommittment,
      },
    };
  }
}
