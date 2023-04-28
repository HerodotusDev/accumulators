import CoreMMR, { PrecomputationMMR } from "@herodotus_dev/mmr-core";
import { StarkPedersenHasher } from "@herodotus_dev/mmr-hashes";
import MMRRocksDBStore from "../src";

const store = new MMRRocksDBStore("./rocksdb_data");
const hasher = new StarkPedersenHasher();

describe("precomputation", () => {
  const rootAt6Leaves = "0x04a1ae364258121690285af43cd4ee91adfd6a8647211748657d8e66835a20a1";
  let mmr: CoreMMR;

  beforeAll(async () => {
    await store.init();
  });

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
    await expect(mmr.verifyProof(proof, "5")).resolves.toEqual(true);
  });

  it("should precompute from parent tree", async () => {
    const precomputationMmr = await PrecomputationMMR.initialize(store, hasher, mmr.mmrUuid, "precomputed");

    await precomputationMmr.append("4");
    await precomputationMmr.append("5");
    await precomputationMmr.append("6");

    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const proof = await precomputationMmr.getProof(8);
    await expect(precomputationMmr.verifyProof(proof, "5")).resolves.toEqual(true);

    await precomputationMmr.close();
  });
});

describe("empty mmr", () => {
  let mmr: CoreMMR;

  beforeEach(async () => {
    mmr = new CoreMMR(store, hasher);
  });

  it("should precompute from empty mmr", async () => {
    const precomputationMmr = await PrecomputationMMR.initialize(store, hasher, mmr.mmrUuid, "precomputed");

    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual("0x0");

    await precomputationMmr.append("1");
    await precomputationMmr.append("2");

    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual(
      "0x067cfcdd3b4a8f67853ecac650440dad1bac6de440def9f196e9b9968d9a00df"
    );
  });
});
