import MMRInMemoryStore from "@herodotus_dev/mmr-memory";
import { StarkPedersenHasher } from "@herodotus_dev/mmr-hashes";
import CoreMMR, { AppendResult } from "../src";

describe("core", () => {
  const leaves = ["1", "2", "3", "4", "5"]; // Elements data for this test suite (do not modify).
  const rootAt6Leaves = "0x04a1ae364258121690285af43cd4ee91adfd6a8647211748657d8e66835a20a1";

  let mmr: CoreMMR;
  let appendsResults: AppendResult[];

  beforeEach(async () => {
    const store = new MMRInMemoryStore();
    const hasher = new StarkPedersenHasher();

    mmr = new CoreMMR(store, hasher as any);
    appendsResults = [];

    for (const leaf of leaves) {
      appendsResults.push(await mmr.append(leaf));
    }
  });

  it("should compute parent tree", async () => {
    const lastLeafIndex = appendsResults[appendsResults.length - 1].leafIndex;

    await expect(mmr.append("6")).resolves.toEqual({
      leavesCount: 6,
      elementsCount: 10,
      leafIndex: 9,
      rootHash: "0x04a1ae364258121690285af43cd4ee91adfd6a8647211748657d8e66835a20a1",
    } as AppendResult);

    await expect(mmr.getPeaks()).resolves.toEqual([
      "0x004a1fead9ecdd90793ba10b7da6e8a30d655843296f148f147a89cb3e978528",
      "0x038b387444a2cf8d09094d58f04d27d8e52e0c8de57c75fb13416b618c3d4ec5",
    ]);
    await expect(mmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const proof = await mmr.getProof(lastLeafIndex);
    await expect(mmr.verifyProof(proof, leaves[leaves.length - 1])).resolves.toEqual(true);
  });

  it("should generate and verify non-expiring proofs", async () => {
    const proofs = await Promise.all(
      appendsResults.map(({ leafIndex, elementsCount }) => mmr.getProof(leafIndex, elementsCount))
    );
    const verifications = await Promise.all(
      proofs.map((proof, idx) => mmr.verifyProof(proof, leaves[idx], proof.elementsCount))
    );

    expect(verifications.every((verification) => verification === true)).toBe(true);
  });

  afterEach(async () => {
    await mmr.clear();
    await expect(mmr.getPeaks()).resolves.toEqual([]);
  });
});
