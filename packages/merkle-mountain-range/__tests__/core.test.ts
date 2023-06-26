import MemoryStore from "@accumulators/memory";
import { StarkPedersenHasher } from "@accumulators/hashers";
import CoreMMR, { AppendResult } from "../src";
import { cloneDeep } from "lodash";

describe("core", () => {
  const leaves = ["1", "2", "3", "4", "5"]; // Elements data for this test suite (do not modify).
  const rootAt6Leaves = "0x04a1ae364258121690285af43cd4ee91adfd6a8647211748657d8e66835a20a1";

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
      appendsResults.map(({ leafIndex, elementsCount }) => mmr.getProof(leafIndex, { elementsCount }))
    );
    const verifications = await Promise.all(
      proofs.map((proof, idx) => mmr.verifyProof(proof, leaves[idx], { elementsCount: proof.elementsCount }))
    );

    expect(verifications.every((verification) => verification === true)).toBe(true);
  });

  it("Should generate multiple proofs", async () => {
    const proofs = await mmr.getProofs(appendsResults.map((r) => r.leafIndex));
    const verifications = await Promise.all(proofs.map((proof, idx) => mmr.verifyProof(proof, leaves[idx])));
    expect(verifications.every((verification) => verification === true)).toBe(true);
  });

  const createMmrWithValues = async (values: string[], mmrId?: string) => {
    const store = new MemoryStore();
    const hasher = new StarkPedersenHasher();
    const mmr = new CoreMMR(store, hasher, mmrId);
    for (const leaf of values) {
      await mmr.append(leaf);
    }
    return mmr;
  };

  it("Should successfully perform an update", async () => {
    await mmr.update(1, "7");

    const expected = await createMmrWithValues(["7", "2", "3", "4", "5"], mmr.mmrId);

    expect(await mmr.rootHash.get()).toEqual(await expected.rootHash.get());
    expect(mmr.hashes).toEqual(expected.hashes);

    expected.clear();
  });

  it("Should throw index error", async () => {
    await expect(mmr.update(3, "1")).rejects.toThrow("Provided index is not a leaf");

    const expected = await createMmrWithValues(["1", "2", "3", "4", "5"], mmr.mmrId);
    expect(mmr.hashes).toEqual(expected.hashes);
  });

  it("Should change hashes in db", async () => {
    const store = new MemoryStore();
    const hasher = new StarkPedersenHasher();
    const mmr = new CoreMMR(store, hasher);
    for (let i = 0; i < 6; i++) {
      await mmr.append((Math.pow(7, i) % 13).toString());
    }
    const storeCopy = new MemoryStore();
    (storeCopy as any).store = cloneDeep((store as any).store);

    await mmr.update(4, "0");
    const id = mmr.mmrId;

    // check if root hash changed
    expect(await store.get(`${id}:root_hash`)).not.toEqual(await storeCopy.get(`${id}:root_hash`));

    // check if path did change
    const path = [4, 6, 7];
    for (const p of path) {
      expect(await store.get(`${id}:hashes:${p}`)).not.toEqual(await storeCopy.get(`${id}:hashes:${p}`));
    }
    // check if other did not change
    const other = [1, 2, 3, 5, 8, 9, 10];
    for (const o of other) {
      expect(await store.get(`${id}:hashes:${o}`)).toEqual(await storeCopy.get(`${id}:hashes:${o}`));
    }
  });

  it("Should match root hash after updates", async () => {
    const store = new MemoryStore();
    const hasher = new StarkPedersenHasher();
    const mmr = new CoreMMR(store, hasher);
    let x = 1;
    for (let i = 0; i < 1000; i++) {
      x *= 127;
      x %= 79;
      await mmr.append(x.toString());
    }
    await mmr.update(74, "21");
    await mmr.update(979, "40");
    await mmr.update(1395, "1");
    expect(await mmr.rootHash.get()).toEqual("0x062b72ee620b9fa5e2526e7260d4acd8ab5e1e01279aedf0e74e35e5a277393a");
  });

  afterEach(async () => {
    await mmr.clear();
    await expect(mmr.getPeaks()).resolves.toEqual([]);
  });
});
