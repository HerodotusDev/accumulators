import { BTree } from "../src";
import MemoryStore from "@accumulators/memory";
import { StarkPoseidonHasher } from "@accumulators/hashers";

describe("BTree", () => {
  let btree: BTree;

  beforeEach(async () => {
    btree = new BTree(() => new MemoryStore(), new StarkPoseidonHasher(), "0x0", 1, 8);
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
});
