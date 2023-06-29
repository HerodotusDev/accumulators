import { IStore, IHasher } from "@accumulators/core";
import CoreMMR from "@accumulators/merkle-mountain-range";
// import { IncrementalMerkleTree } from "@accumulators/incremental-merkle-tree";
import { IncrementalMerkleTree } from "../../incremental-merkle-tree/src";

import MemoryStore from "@accumulators/memory";
import { StarkPedersenHasher } from "@accumulators/hashers";

export class BTree {
  private mmr: CoreMMR;
  private merkleTrees: Map<number, IncrementalMerkleTree>; // index in MMR -> merkle tree
  private treeStores: Map<number, IStore>; // TODO: remove, index in MMR -> store (TEMPORARY JUST FOR PRINTING)

  constructor(
    protected readonly store: IStore,
    protected readonly hasher: IHasher,
    protected readonly BLOCK_SIZE: number = 8
  ) {
    this.mmr = new CoreMMR(new MemoryStore(), hasher); // TODO: move to one store
    this.merkleTrees = new Map();
    this.treeStores = new Map(); // TODO: move to one store
  }

  private splitBlockOffset(index: number) {
    const blockIndex = Math.floor(index / this.BLOCK_SIZE);
    const blockBegin = blockIndex * this.BLOCK_SIZE;
    const blockEnd = blockBegin + this.BLOCK_SIZE - 1;
    const blockName = `${blockBegin}-${blockEnd}`;
    return [blockName, index % this.BLOCK_SIZE] as const;
  }

  private getMerkleHash(blockName: string, account: string, rootHash: string) {
    const [blockBegin, blockEnd] = blockName.split("-");
    return this.hasher.hash([
      this.hasher.hash([
        this.hasher.hash(["0x" + parseInt(blockBegin).toString(16), "0x" + parseInt(blockEnd).toString(16)]),
        account,
      ]),
      rootHash,
    ]); // TODO: what about chainId
  }

  getRootHash() {
    return this.mmr.rootHash.get();
  }

  async update(account: string, index: number, value: string) {
    const [block, offset] = this.splitBlockOffset(index);
    const blockIndexAsString = await this.store.get(`${account}:${block}`);
    const blockIndex = blockIndexAsString === undefined ? undefined : parseInt(blockIndexAsString);
    if (blockIndex === undefined) {
      // create new merkle tree
      const newStore = new MemoryStore();
      const newMerkleTree = await IncrementalMerkleTree.initialize(this.BLOCK_SIZE, "0x0", this.hasher, newStore); // TODO: update null value
      const merkleRootHash = await newMerkleTree.updateAuthenticated(offset, value);
      const mmrLeaf = this.getMerkleHash(block, account, merkleRootHash);

      // add to mmr
      const blockIndex = (await this.mmr.append(mmrLeaf)).leafIndex;
      await this.store.set(`${account}:${block}`, `${blockIndex}`);
      this.treeStores.set(blockIndex, newStore); // TODO: remove
      this.merkleTrees.set(blockIndex, newMerkleTree);
    } else {
      const merkleTree = this.merkleTrees.get(blockIndex);
      const merkleRootHash = await merkleTree.updateAuthenticated(offset, value);
      const mmrLeaf = this.getMerkleHash(block, account, merkleRootHash);
      await this.mmr.update(blockIndex, mmrLeaf);
    }

    // update mmr

    for (const [key, val] of this.merkleTrees.entries()) {
      console.log(key, (val as any).store.store);
    }
    console.log(this.store);
    console.log((this.mmr.hashes as any).store);
  }
}

// TODO: jest tests
(async function () {
  const store = new MemoryStore();
  const hasher = new StarkPedersenHasher();
  const tree = new BTree(store, hasher);
  await tree.update("0xacc07", 12, "0x12");
  await tree.update("0xacc07", 6, "0x14");
  await tree.update("0xacc07", 13, "0x13");
})();
