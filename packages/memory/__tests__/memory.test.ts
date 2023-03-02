import CoreMMR, { PrecomputationMMR } from "@herodotus_dev/mmr-core";
import { StarkPedersenHasher } from "@herodotus_dev/mmr-hashes";
import MMRInMemoryStore from "../src";

const store = new MMRInMemoryStore();
const hasher = new StarkPedersenHasher();

describe("precomputation", () => {
  const rootAt6Leaves = "0x04a1ae364258121690285af43cd4ee91adfd6a8647211748657d8e66835a20a1";
  let mmr: CoreMMR;

  beforeEach(async () => {
    mmr = new CoreMMR(store, hasher);
    await mmr.append("1");
    await mmr.append("2");
    await mmr.append("3");
  });

  it("should compute parent tree", async () => {
    await mmr.append("4");
    await mmr.append("5");
    await mmr.append("6");

    await expect(mmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const proof = await mmr.getProof(8);
    await expect(mmr.verifyProof(8, "5", proof)).resolves.toEqual(true);
  });

  it("should precompute from parent tree", async () => {
    const precomputationMmr = await PrecomputationMMR.initialize(store, hasher as any, mmr.mmrUuid, "precomputed");

    await precomputationMmr.append("4");
    await precomputationMmr.append("5");
    await precomputationMmr.append("6");

    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const proof = await precomputationMmr.getProof(8);
    await expect(precomputationMmr.verifyProof(8, "5", proof)).resolves.toEqual(true);

    await precomputationMmr.close();
  });
});
