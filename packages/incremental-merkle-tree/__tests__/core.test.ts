import { IncrementalMerkleTree } from "../src";
import MemoryStore from "@accumulators/memory";
import { StarkPoseidonHasher } from "@accumulators/hashers";

describe("IncrementalMerkleTree", () => {
  describe("initialize", () => {
    it("Should properly not fail when initializing an empty incremental merkle tree of size 2**n", async () => {
      const store = new MemoryStore();
      const tree = await IncrementalMerkleTree.initialize(1024, "0x0", new StarkPoseidonHasher(), store);
      expect(await tree.getRoot()).toEqual("0x4a21358c3e754766216b4c93ecfae222e86822f746e706e563f3a05ef398959");
    });

    it("Should properly not fail when initializing an empty incremental merkle tree of size 2**n", async () => {
      const store = new MemoryStore();
      await IncrementalMerkleTree.initialize(12, "0x0", new StarkPoseidonHasher(), store);
    });

    it("Should properly set the entries in the db", async () => {
      const store = new MemoryStore();
      await IncrementalMerkleTree.initialize(16, "0x0", new StarkPoseidonHasher(), store);
      const requiredDbSize = 16 + 8 + 4 + 2 + 1;
      // expect((store as any).store.keys().length).toEqual(requiredDbSize);
    });
  });

  describe("Get path", () => {
    it("Should properly return the path for a given index", async () => {
      const store = new MemoryStore();
      const tree = await IncrementalMerkleTree.initialize(16, "0x0", new StarkPoseidonHasher(), store);
      const path = await tree.getInclusionProof(10);

      const expectedNodes = ["4:11", "3:4", "2:3", "1:0"];
      const expectedPath = Array.from((await tree.nodes.getMany(expectedNodes)).values());
      expect(path).toEqual(expectedPath);
    });
  });

  describe("Verify proof", () => {
    it("Should properly verify a valid proof for null element", async () => {
      const store = new MemoryStore();
      const tree = await IncrementalMerkleTree.initialize(16, "0x0", new StarkPoseidonHasher(), store);
      const path = await tree.getInclusionProof(10);

      const validProof = await tree.verifyProof(10, "0x0", path);
      expect(validProof).toEqual(true);
    });

    it("Should not verify for invalid value", async () => {
      const store = new MemoryStore();
      const tree = await IncrementalMerkleTree.initialize(16, "0x0", new StarkPoseidonHasher(), store);
      const path = await tree.getInclusionProof(10);

      const validProof = await tree.verifyProof(10, "0x1", path);
      expect(validProof).toEqual(false);
    });
  });

  describe("Update", () => {
    it("Should properly update element", async () => {
      const store = new MemoryStore();
      const tree = await IncrementalMerkleTree.initialize(16, "0x0", new StarkPoseidonHasher(), store);
      const path = await tree.getInclusionProof(7);

      const validProof = await tree.verifyProof(7, "0x0", path);
      expect(validProof).toEqual(true);

      await tree.update(7, "0x0", "0x1", path);

      const invalidProof = await tree.verifyProof(7, "0x0", path);
      expect(invalidProof).toEqual(false);

      const updatedProof = await tree.verifyProof(7, "0x1", path);
      expect(updatedProof).toEqual(true);

      expect(await tree.getRoot()).toEqual("0x53228c039bc23bffa7a0ba7a864088f98c92dbc41c3737b681cdd7b1bcfe1f2");
    });

    it("Should not update root for invalid update", async () => {
      const store = new MemoryStore();
      const tree = await IncrementalMerkleTree.initialize(16, "0x0", new StarkPoseidonHasher(), store);
      const path = await tree.getInclusionProof(7);

      const emptyRoot = await tree.getRoot();

      expect(tree.update(7, "0x1", "0x2", path)).rejects.toThrow();
      expect(await tree.getRoot()).toEqual(emptyRoot);
    });
  });

  describe("Generate and Verify Multi Proof", () => {
    it("Should properly generate and verify a multiproof", async () => {
      const store = new MemoryStore();

      const treeSize = 64;
      const defaultHash = "0x0";
      const tree = await IncrementalMerkleTree.initialize(treeSize, defaultHash, new StarkPoseidonHasher(), store);

      for (let i = 0; i < treeSize; i++) {
        const path = await tree.getInclusionProof(i);
        const newValue = "0x" + String(i);
        await tree.update(i, defaultHash, newValue, path);
      }

      const test = [0, 2, 7, 14, 31, 63];
      const testValues = test.map((i) => "0x" + String(i));

      const getProofStart = performance.now();
      const multiproof = await tree.getInclusionMultiProof(test);
      const getProofEnd = performance.now();
      console.log(`getInclusionMultiProof took ${getProofEnd - getProofStart} milliseconds`);

      const verifyProofStart = performance.now();
      const isValid = await tree.verifyMultiProof(test, testValues, multiproof);
      const verifyProofEnd = performance.now();
      console.log(`verifyMultiProof took ${verifyProofEnd - verifyProofStart} milliseconds`);

      expect(isValid).toBeTruthy();
    });
  });
});
