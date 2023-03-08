import CoreMMR from "../src";
import { StarkPedersenHasher } from "@herodotus_dev/mmr-hashes";
import MMRInMemoryStore from "@herodotus_dev/mmr-memory";

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
    const append = await mmr.append("5");

    await expect(mmr.append("6")).resolves.toEqual({
      lastPos: 10,
      leafIdx: 9,
      leavesCount: 6,
      rootHash: "0x04a1ae364258121690285af43cd4ee91adfd6a8647211748657d8e66835a20a1",
    });

    await expect(mmr.getPeaks()).resolves.toEqual([
      "0x004a1fead9ecdd90793ba10b7da6e8a30d655843296f148f147a89cb3e978528",
      "0x038b387444a2cf8d09094d58f04d27d8e52e0c8de57c75fb13416b618c3d4ec5",
    ]);
    await expect(mmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const proof = await mmr.getProof(append.leafIdx);
    await expect(mmr.verifyProof(append.leafIdx, "5", proof)).resolves.toEqual(true);
  });
});
