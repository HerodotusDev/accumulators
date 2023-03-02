import CoreMMR from "../src";
import { StarkPedersenHasher } from "@merkle-mountain-range/hashes";
import { MMRInMemoryStore } from "@merkle-mountain-range/memory";

const store = new MMRInMemoryStore();
const hasher = new StarkPedersenHasher();

describe("precomputation", () => {
  let mmr: CoreMMR;
  const rootAt6Leaves = "0x04a1ae364258121690285af43cd4ee91adfd6a8647211748657d8e66835a20a1";

  it("should compute parent tree", async () => {
    mmr = new CoreMMR(store, hasher as any);
    await mmr.append("1");
    await mmr.append("2");
    await mmr.append("3");
    await mmr.append("4");
    await mmr.append("5");
    await mmr.append("6");

    expect(await mmr.bagThePeaks()).toEqual(rootAt6Leaves);
    const proof = await mmr.getProof(8);
    expect(await mmr.verifyProof(8, "5", proof)).toEqual(true);
  });
});
