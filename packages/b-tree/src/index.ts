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
  regions: {
    account: string;
    page: string;
    rootHash: string;
  }[];
};

export type UpdateData = {
  account: string;
  index: number;
  value: string;
};

export enum BTREE_METADATA_KEYS {
  MMR_LEAF_INDEX = "mmr-leaf-index",
  PAGES = "pages",
  MAIN_TREE = "main",
  REGION_TO_TREE = "region",
}

interface ILogger {
  log(data: string): void;
}

class ConsoleLogger implements ILogger {
  log(data: string) {
    console.log(data);
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
    protected readonly logger?: ILogger,
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

  async updateMany(updates: UpdateData[]): Promise<UpdateResult> {
    const perPageUpdates = new Map(); // account:pageRange -> { offset, value }[]
    for (const update of updates) {
      const { pageRange, offset } = this.getPageAndIndex(update.index);
      const pageUpdates = perPageUpdates.get(`${update.account}:${pageRange}`) || [];
      pageUpdates.push({ offset, value: update.value });
      perPageUpdates.set(`${update.account}:${pageRange}`, pageUpdates);
    }
    const keysToGet = Array.from(perPageUpdates, ([pageName]) => {
      return `${this.treeId}:${BTREE_METADATA_KEYS.REGION_TO_TREE}:${pageName}`;
    });
    const pageMerkleTreeKeys = await this.store.getMany(keysToGet);
    const regionResults = [];
    let rootHash;
    for (const [pageName, updates] of perPageUpdates) {
      const pageMerkleTreeId = pageMerkleTreeKeys.get(
        `${this.treeId}:${BTREE_METADATA_KEYS.REGION_TO_TREE}:${pageName}`
      );

      // create new merkle tree or recreate existing one
      const merkleTree =
        pageMerkleTreeId === undefined
          ? await IncrementalMerkleTree.initialize(
              this.PAGE_SIZE,
              this.NULL_VALUE,
              this.hasher,
              this.store,
              `${this.treeId}:${BTREE_METADATA_KEYS.PAGES}:${ulid()}`
            )
          : new IncrementalMerkleTree(this.PAGE_SIZE, this.NULL_VALUE, this.hasher, this.store, pageMerkleTreeId);
      this.logger?.log(
        (pageMerkleTreeId === undefined ? `Created new` : `Recreated`) +
          ` merkle tree with id ${merkleTree.treeId.split(":")[2]}`
      );

      // make updates to merkle tree
      const [account, pageRange] = pageName.split(":");
      let merkleRootHash;
      for (const { offset, value } of updates) {
        merkleRootHash = await merkleTree.updateAuthenticated(offset, value);
        this.logger?.log(
          `Updated merkle tree with id ${merkleTree.treeId.split(":")[2]} at offset ${offset} with value ${value}`
        );
      }

      // update mmr
      const regionCommittment = this.computeRegionCommittment(pageRange, account, merkleRootHash);
      this.logger?.log(
        `Computed region committment for page ${pageRange} and account ${account} to be ${regionCommittment}`
      );
      if (pageMerkleTreeId === undefined) {
        const appendResult = await this.mmr.append(regionCommittment);
        this.logger?.log(`Appended region committment to mmr at leaf index ${appendResult.leafIndex}`);
        rootHash = appendResult.rootHash;
        await this.store.set(`${merkleTree.treeId}:${BTREE_METADATA_KEYS.MMR_LEAF_INDEX}`, `${appendResult.leafIndex}`);
        await this.store.set(
          `${this.treeId}:${BTREE_METADATA_KEYS.REGION_TO_TREE}:${account}:${pageRange}`,
          `${merkleTree.treeId}`
        );
      } else {
        const leafIndex = parseInt(await this.store.get(`${pageMerkleTreeId}:${BTREE_METADATA_KEYS.MMR_LEAF_INDEX}`));
        rootHash = await this.mmr.update(leafIndex, regionCommittment);
        this.logger?.log(`Updated region committment in mmr at leaf index ${leafIndex}`);
      }
      regionResults.push({
        account: account,
        rootHash: merkleRootHash,
        page: pageRange,
      });
    }
    return { regions: regionResults, mmrRoot: rootHash };
  }
  update(account: string, index: number, value: string) {
    return this.updateMany([{ account, index, value }]);
  }
}
