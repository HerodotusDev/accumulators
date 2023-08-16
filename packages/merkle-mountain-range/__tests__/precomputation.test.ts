import CoreMMR, { PrecomputationMMR } from "../src";
import { StarkPedersenHasher } from "@accumulators/hashers";
import MemoryStore from "@accumulators/memory";

const store = new MemoryStore();
const hasher = new StarkPedersenHasher();

describe("precomputation", () => {
  let mmr: CoreMMR;
  const rootAt6Leaves = "0x03203d652ecaf8ad941cbbccddcc0ce904d81e2c37e6dcff4377cf988dac493c";

  beforeEach(async () => {
    mmr = new CoreMMR(store, hasher);
    await mmr.append("1");
    await mmr.append("2");
    await mmr.append("3");
  });

  it("should compute parent tree", async () => {
    await mmr.append("4");
    const { leafIndex } = await mmr.append("5");
    await mmr.append("6");

    await expect(mmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const proof = await mmr.getProof(leafIndex);
    await expect(mmr.verifyProof(proof, "5")).resolves.toEqual(true);
  });

  it("should precompute from parent tree", async () => {
    const precomputationMmr = await PrecomputationMMR.initialize(store, hasher, mmr.mmrId, "precomputed");

    await precomputationMmr.append("4");
    const { leafIndex } = await precomputationMmr.append("5");
    await precomputationMmr.append("6");

    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const proof = await precomputationMmr.getProof(leafIndex);
    await expect(precomputationMmr.verifyProof(proof, "5")).resolves.toEqual(true);

    await precomputationMmr.close();
    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual("0x0");

    //? After closing the precomputation, the parent MMR should still work
    await mmr.append("4");
    const { leafIndex: parentLeafIndex } = await mmr.append("5");
    await mmr.append("6");
    await expect(mmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const parentProof = await mmr.getProof(parentLeafIndex);
    await expect(mmr.verifyProof(parentProof, "5")).resolves.toEqual(true);
  });
});

describe("empty mmr", () => {
  let mmr: CoreMMR;

  beforeEach(async () => {
    mmr = new CoreMMR(store, hasher);
  });

  it("should precompute from empty mmr", async () => {
    const precomputationMmr = await PrecomputationMMR.initialize(store, hasher, mmr.mmrId, "precomputed");

    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual("0x0");

    await precomputationMmr.append("1");
    await precomputationMmr.append("2");

    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual(
      "0x05bb9440e27889a364bcb678b1f679ecd1347acdedcbf36e83494f857cc58026"
    );
  });
});
