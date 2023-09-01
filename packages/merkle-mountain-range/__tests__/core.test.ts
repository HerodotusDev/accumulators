import MemoryStore from "@accumulators/memory";
import { KeccakHasher, StarkPedersenHasher, StarkPoseidonHasher } from "@accumulators/hashers";
import CoreMMR, { AppendResult } from "../src";

describe("core", () => {
  const leaves = ["1", "2", "3", "4", "5"]; // Elements data for this test suite (do not modify).
  const rootAt6Leaves = "0x03203d652ecaf8ad941cbbccddcc0ce904d81e2c37e6dcff4377cf988dac493c";

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
    const mmr = await CoreMMR.createWithGenesis(new MemoryStore(), new KeccakHasher());
    expect(await mmr.rootHash.get()).toEqual("0xce92cc894a17c107be8788b58092c22cd0634d1489ca0ce5b4a045a1ce31b168");
  });

  it("should generate mmr with genesis for poseidon hasher", async () => {
    const mmr = await CoreMMR.createWithGenesis(new MemoryStore(), new StarkPoseidonHasher());
    await expect(mmr.rootHash.get()).resolves.toEqual(
      "0x2241b3b7f1c4b9cf63e670785891de91f7237b1388f6635c1898ae397ad32dd"
    );
  });

  it("Shoud properly map a leaf index to an element index", () => {
    const expectedIndices = [1, 2, 4, 5, 8, 9, 11, 12, 16, 17, 19];
    expectedIndices.forEach((expectedIndex, arrIdx) => {
      const elementIndex = CoreMMR.mapLeafIndexToElementIndex(arrIdx + 1);
      expect(elementIndex).toEqual(expectedIndex);
    });
  });

  it("should compute parent tree", async () => {
    const lastLeafElementIndex = appendsResults[appendsResults.length - 1].elementIndex;

    await expect(mmr.append("6")).resolves.toEqual({
      leavesCount: 6,
      elementsCount: 10,
      elementIndex: 9,
      rootHash: "0x03203d652ecaf8ad941cbbccddcc0ce904d81e2c37e6dcff4377cf988dac493c",
    } as AppendResult);

    await expect(mmr.getPeaks()).resolves.toEqual([
      "0x06a27df2b1eaf16c77478b9c001cfdebe956b7ad878b141b0b4b24659fa59fde",
      "0x01f680f4b3e66b11ac6b827ef46e7d2da4075e0dc83b7e322d590dbb7687f417",
    ]);
    await expect(mmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
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
