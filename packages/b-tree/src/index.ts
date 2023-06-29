import { IStore, IHasher } from "@accumulators/core";
import CoreMMR from "@accumulators/merkle-mountain-range";
import { IncrementalMerkleTree } from "../../incremental-merkle-tree/src";

export type UpdateResult = {
  mmrRoot: string;
  region: {
    account: string;
    from: number;
    to: number;
    hash: string;
  };
};

export class BTree {
  private mmr: CoreMMR;
  private store: IStore;
  private merkleTrees: Map<number, IncrementalMerkleTree>; // index in MMR -> merkle tree

  constructor(
    protected readonly getStore: () => IStore,
    protected readonly hasher: IHasher,
    protected readonly NULL_VALUE: string,
    protected readonly CHAIN_ID: number = 1,
    protected readonly PAGE_SIZE: number = 1024
  ) {
    this.store = getStore();
    this.mmr = new CoreMMR(getStore(), hasher); // TODO: move to one store
    this.merkleTrees = new Map();
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

    const pageIndexAsString = await this.store.get(`${account}:${pageRange}`);
    const pageIndex = pageIndexAsString === undefined ? undefined : parseInt(pageIndexAsString);

    let rootHash: string;
    let regionCommittment: string;
    if (pageIndex === undefined) {
      // create new merkle tree
      const newStore = this.getStore();
      const newMerkleTree = await IncrementalMerkleTree.initialize(
        this.PAGE_SIZE,
        this.NULL_VALUE,
        this.hasher,
        newStore
      );
      const merkleRootHash = await newMerkleTree.updateAuthenticated(offset, value);
      regionCommittment = this.computeRegionCommittment(pageRange, account, merkleRootHash);

      // add to mmr
      const appendResult = await this.mmr.append(regionCommittment);
      const blockIndex = appendResult.leafIndex;
      rootHash = appendResult.rootHash;
      await this.store.set(`${account}:${pageRange}`, `${blockIndex}`);
      this.merkleTrees.set(blockIndex, newMerkleTree);
    } else {
      const merkleTree = this.merkleTrees.get(pageIndex);
      const merkleRootHash = await merkleTree.updateAuthenticated(offset, value);
      regionCommittment = this.computeRegionCommittment(pageRange, account, merkleRootHash);
      rootHash = await this.mmr.update(pageIndex, regionCommittment);
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
