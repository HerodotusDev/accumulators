import MemoryStore from "@accumulators/memory";
import { KeccakHasher, StarkPedersenHasher, StarkPoseidonHasher } from "@accumulators/hashers";
import CoreMMR, { AppendResult } from "../src";

describe("core", () => {
  const leaves = ["1", "2", "3", "4", "5"]; // Elements data for this test suite (do not modify).

  let mmr: CoreMMR;
  let appendsResults: AppendResult[];

  beforeEach(async () => {
    const store = new MemoryStore();
    const hasher = new StarkPedersenHasher();

    mmr = new CoreMMR(store, hasher);
    appendsResults = [];

    for (const leaf of leaves) {
      appendsResults.push(await mmr.append(leaf));
    }
  });

  it("should generate mmr with genesis for keccak hasher", async () => {
    const hasher = new KeccakHasher();
    const mmr = await CoreMMR.createWithGenesis(new MemoryStore(), hasher);
    expect(await mmr.rootHash.get()).toEqual(hasher.hash(["1", hasher.getGenesis()]));
  });

  it("should get a stable root hash for given args for keccak", async () => {
    const hasher = new KeccakHasher();
    const mmr = await CoreMMR.createWithGenesis(new MemoryStore(), hasher);

    expect(await mmr.leavesCount.get()).toEqual(1);

    await mmr.append("1");
    await mmr.append("0x1");
    await mmr.append("2");
    await mmr.append("0x2");
    await mmr.append("3");
    const appendedResult = await mmr.append("0x3");

    expect(appendedResult.leavesCount).toEqual(7);

    const stable_bag = "0x46d676ef5c3e8c6668ec577baee408f7b149d05b3ea31f4f2ad0d2a0ddc2a9b3";

    const bag = await mmr.bagThePeaks();

    const leafCount = await mmr.leavesCount.get();

    expect(bag).toEqual(stable_bag);

    const rootHash = await mmr.calculateRootHash(bag, leafCount);

    const stableRootHash = "0xe336600238639f1ea4e2d78db1c8353a896487fa8fb9f2c3898888817008b77b";
    expect(rootHash).toEqual(stableRootHash);
  });

  it("should generate mmr with genesis for poseidon hasher", async () => {
    const hasher = new StarkPoseidonHasher();
    const mmr = await CoreMMR.createWithGenesis(new MemoryStore(), hasher);
    expect(await mmr.rootHash.get()).toEqual(hasher.hash(["1", hasher.getGenesis()]));
  });

  it("should get a stable root hash for given args for stark poseidon hasher", async () => {
    const hasher = new StarkPoseidonHasher();
    const mmr = await CoreMMR.createWithGenesis(new MemoryStore(), hasher);

    expect(await mmr.leavesCount.get()).toEqual(1);

    await mmr.append("1");
    await mmr.append("0x1");
    await mmr.append("2");
    await mmr.append("0x2");
    await mmr.append("3");
    const appendedResult = await mmr.append("0x3");

    expect(appendedResult.leavesCount).toEqual(7);

    const stable_bag = "0x1b6fe636cf8f005b539f3d5c9ca5b5f435e995ecf51894fd3045a5e8389d467";

    const bag = await mmr.bagThePeaks();

    const leafCount = await mmr.leavesCount.get();

    expect(bag).toEqual(stable_bag);

    const rootHash = await mmr.calculateRootHash(bag, leafCount);

    const stableRootHash = "0x113e2abc1e91aa48aa7c12940061c924437fcd27829b8594de54a0cea57d232";
    expect(rootHash).toEqual(stableRootHash);
  });


  it("Should properly map a leaf index to an element index", () => {
    const expectedIndices = [1, 2, 4, 5, 8, 9, 11, 12, 16, 17, 19];
    expectedIndices.forEach((expectedIndex, arrIdx) => {
      const elementIndex = CoreMMR.mapLeafIndexToElementIndex(arrIdx);
      expect(elementIndex).toEqual(expectedIndex);
    });
  });

  it("Should properly map an element index to a leaf index", () => {
    const elementIndices = [1, 2, 4, 5, 8, 9, 11, 12, 16, 17, 19];
    elementIndices.forEach((elementIndex, arrIdx) => {
      const leafIndex = CoreMMR.mapElementIndexToLeafIndex(elementIndex);
      expect(leafIndex).toEqual(arrIdx);
    });
  });

  it("should compute parent tree", async () => {
    const lastLeafElementIndex = appendsResults[appendsResults.length - 1].elementIndex;

    const appendedLeaf = "6";

    const hasher = new StarkPedersenHasher();
    const node3 = hasher.hash([leaves[0], leaves[1]]);
    const node6 = hasher.hash([leaves[2], leaves[3]]);
    const node7 = hasher.hash([node3, node6]);
    const node10 = hasher.hash([leaves[4], appendedLeaf]);
    const bag = hasher.hash([node7, node10]);
    const root = hasher.hash(["10", bag]);

    await expect(mmr.append(appendedLeaf)).resolves.toEqual({
      leavesCount: 6,
      elementsCount: 10,
      elementIndex: 9,
      rootHash: root,
    } as AppendResult);

    await expect(mmr.getPeaks()).resolves.toEqual([node7, node10]);
    await expect(mmr.bagThePeaks()).resolves.toEqual(bag);
    const proof = await mmr.getProof(lastLeafElementIndex);
    await expect(mmr.verifyProof(proof, leaves[leaves.length - 1])).resolves.toEqual(true);
  });

  it("should generate and verify non-expiring proofs", async () => {
    const proofs = await Promise.all(
      appendsResults.map(({ elementIndex, elementsCount }) => mmr.getProof(elementIndex, { elementsCount }))
    );
    const verifications = await Promise.all(
      proofs.map((proof, idx) => mmr.verifyProof(proof, leaves[idx], { elementsCount: proof.elementsCount }))
    );

    expect(verifications.every((verification) => verification === true)).toBe(true);
  });

  it("Should generate multiple proofs", async () => {
    const proofs = await mmr.getProofs(appendsResults.map((r) => r.elementIndex));
    const verifications = await Promise.all(proofs.map((proof, idx) => mmr.verifyProof(proof, leaves[idx])));
    expect(verifications.every((verification) => verification === true)).toBe(true);
  });

  afterEach(async () => {
    await mmr.clear();
    await expect(mmr.getPeaks()).resolves.toEqual([]);
  });
});
