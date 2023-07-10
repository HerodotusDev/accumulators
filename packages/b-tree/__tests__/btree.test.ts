import { BTree } from "../src";
import MemoryStore from "@accumulators/memory";
import { StarkPoseidonHasher } from "@accumulators/hashers";

describe("BTree", () => {
  let btree: BTree;
  let storage: MemoryStore;

  beforeEach(async () => {
    storage = new MemoryStore();
    btree = new BTree(storage, new StarkPoseidonHasher(), "0x0", 1, 8);
  });

  it("Should change root hash", async () => {
    await btree.update("0x3abf9c25d6e17F8c", 0, "0x1");
    const h1 = await btree.getRootHash();
    await btree.update("0x3abf9c25d6e17F8c", 1, "0x2");
    const h2 = await btree.getRootHash();
    expect(h2).not.toEqual(h1);

    await btree.update("0x3abf9c25d6e17F8c", 0, "0x3");
    const h3 = await btree.getRootHash();
    expect(h3).not.toEqual(h2);
    expect(h3).not.toEqual(h1);

    await btree.update("0x3abf9c25d6e17F8c", 0, "0x1");
    const h4 = await btree.getRootHash();
    expect(h4).toEqual(h2);
    expect(h4).not.toEqual(h1);
    expect(h4).not.toEqual(h3);

    await btree.update("0x3abf9c25d6e17F8c", 17, "0x2");
    const h5 = await btree.getRootHash();
    expect(h5).not.toEqual(h4);
    expect(h5).not.toEqual(h3);
    expect(h5).not.toEqual(h2);
    expect(h5).not.toEqual(h1);
  });

  it("Should recreate tree from storage", async () => {
    await btree.update("0x668481d1d3c3822d", 3, "0x1");
    await btree.update("0x668481d1d3c3822d", 4, "0x2");
    await btree.update("0x668481d1d3c3822d", 273, "0x3");

    const h1 = await btree.getRootHash();

    // recreate tree
    const btree2 = new BTree(storage, new StarkPoseidonHasher(), "0x0", 1, 8, undefined, btree.treeId);

    const h2 = await btree2.getRootHash();
    const h3 = (await btree2.update("0x668481d1d3c3822d", 900, "0x4")).mmrRoot;

    expect(h1).toEqual("0x450cd2e15f56cad7b93d0fda754eb1c9ea08ccd8547cba4eb2ba82d7c08fe71");
    expect(h2).toEqual("0x450cd2e15f56cad7b93d0fda754eb1c9ea08ccd8547cba4eb2ba82d7c08fe71");
    expect(h3).toEqual("0x71d0e580fa81bb399c68f7c63c5d3b7488a27f696e37c8a1c459a77ec88c768");
  });
});
