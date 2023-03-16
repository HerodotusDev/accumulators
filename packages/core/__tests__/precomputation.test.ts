import CoreMMR, { PrecomputationMMR } from "../src";
import { StarkPedersenHasher } from "@herodotus_dev/mmr-hashes";
import MMRInMemoryStore from "@herodotus_dev/mmr-memory";

const store = new MMRInMemoryStore();
const hasher = new StarkPedersenHasher();

describe("precomputation", () => {
  let mmr: CoreMMR;
  const rootAt6Leaves = "0x04a1ae364258121690285af43cd4ee91adfd6a8647211748657d8e66835a20a1";

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
    const precomputationMmr = await PrecomputationMMR.initialize(store, hasher as any, mmr.mmrUuid, "precomputed");

    await precomputationMmr.append("4");
    const { leafIndex } = await precomputationMmr.append("5");
    await precomputationMmr.append("6");

    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const proof = await precomputationMmr.getProof(leafIndex);
    await expect(precomputationMmr.verifyProof(proof, "5")).resolves.toEqual(true);

    await precomputationMmr.close();
    await expect(precomputationMmr.bagThePeaks()).rejects.toThrow();

    //? After closing the precomputation, the parent MMR should still work
    await mmr.append("4");
    const { leafIndex: parentLeafIndex } = await mmr.append("5");
    await mmr.append("6");
    await expect(mmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const parentProof = await mmr.getProof(parentLeafIndex);
    await expect(mmr.verifyProof(parentProof, "5")).resolves.toEqual(true);
  });
});
