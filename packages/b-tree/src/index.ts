import { IStore, IHasher } from "@accumulators/core";
import CoreMMR from "@accumulators/merkle-mountain-range";
// import { IncrementalMerkleTree } from "@accumulators/incremental-merkle-tree";
import { IncrementalMerkleTree } from "../../incremental-merkle-tree/src";

import MemoryStore from "@accumulators/memory";
import { StarkPedersenHasher } from "@accumulators/hashers";

class BTree {
  private mmr: CoreMMR;
  private merkleTrees: IncrementalMerkleTree[] = []; // TODO: change to map (leafIndex -> merkleTree)

  constructor(
    protected readonly store: IStore,
    protected readonly hasher: IHasher,
    protected readonly BLOCK_SIZE: number = 8
  ) {
    this.mmr = new CoreMMR(store, hasher);
  }

  private splitBlockOffset(index: number) {
    const blockIndex = Math.floor(index / this.BLOCK_SIZE);
    const blockBegin = blockIndex * this.BLOCK_SIZE;
    const blockEnd = blockBegin + this.BLOCK_SIZE - 1;
    const blockName = `${blockBegin}-${blockEnd}`;
    return [blockName, index % this.BLOCK_SIZE] as const;
  }

  async update(account: string, index: number, value: string) {
    // update incremental merkle tree
    const [block, offset] = this.splitBlockOffset(index);
    const blockIndex = await this.store.get(`${account}:${block}`);
    let merkleRootHash: string;
    if (blockIndex === undefined) {
      await this.store.set(`${account}:${block}`, `${this.merkleTrees.length}`);
      const newMerkleTree = await IncrementalMerkleTree.initialize(this.BLOCK_SIZE, "0x0", this.hasher, this.store); // TODO: update null value
      merkleRootHash = await newMerkleTree.updateAuthenticated(offset, value);
      this.merkleTrees.push(newMerkleTree);
    } else {
      const merkleTree = this.merkleTrees[blockIndex];
      merkleRootHash = await merkleTree.updateAuthenticated(offset, value);
    }

    // calculate hash? (change comment)
    const mmrLeafHash = this.hasher.hash([
      this.hasher.hash([this.hasher.hash(block.split("-")), account]),
      merkleRootHash,
    ]);
    // TODO: ask if this ^^ is correct way to hash it (probably use other hasher) and what about chainId

    console.log(this.merkleTrees.map((v: any) => v.store.store));
  }
}

// TODO: jest tests
(async function () {
  const store = new MemoryStore();
  const hasher = new StarkPedersenHasher();
  const tree = new BTree(store, hasher);
  await tree.update("0xacc07", 12, "0x12");
  await tree.update("0xacc07", 13, "0x13");
  await tree.update("0xacc07", 6, "0x14");
})();
