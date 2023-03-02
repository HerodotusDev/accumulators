import { CoreMMR, PrecomputationMMR } from "@merkle-mountain-range/core";
import { StarkPedersenHasher } from "@merkle-mountain-range/hashes";
import { MMRRocksDBStore } from "../src";

const store = new MMRRocksDBStore("./rocksdb_data");
const hasher = new StarkPedersenHasher();

describe("precomputation", () => {
  const rootAt6Leaves = "0x04a1ae364258121690285af43cd4ee91adfd6a8647211748657d8e66835a20a1";
  let mmr: CoreMMR;

  beforeAll(async () => {
    await store.init(true);
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

    expect(await mmr.bagThePeaks()).toEqual(rootAt6Leaves);
    const proof = await mmr.getProof(8);
    expect(await mmr.verifyProof(8, "5", proof)).toEqual(true);
  });

  it("should precompute from parent tree", async () => {
    const precomputationMmr = await PrecomputationMMR.initialize(store, hasher as any, mmr.mmrUuid, "precomputed");

    await precomputationMmr.append("4");
    await precomputationMmr.append("5");
    await precomputationMmr.append("6");

    expect(await precomputationMmr.bagThePeaks()).toEqual(rootAt6Leaves);
    const proof = await precomputationMmr.getProof(8);
    expect(await precomputationMmr.verifyProof(8, "5", proof)).toEqual(true);
  });
});
