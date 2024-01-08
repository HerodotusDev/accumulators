import MemoryStore from "@accumulators/memory";
import { KeccakHasher, PoseidonHasher, StarkPedersenHasher, StarkPoseidonHasher } from "@accumulators/hashers";
import CoreMMR, { AppendResult } from "../src";

describe("core", () => {
  const leaves = ["1", "2", "3", "4", "5"]; // Elements data for this test suite (do not modify).

  // Instances of CoreMMR for each hasher
  let pedersen_mmr: CoreMMR;
  let keccak_mmr: CoreMMR;
  let poseidon_mmr: CoreMMR;
  let appendsResultsForPedersen: AppendResult[];
  let appendsResultsForKeccak: AppendResult[];
  let appendsResultsForPoseidon: AppendResult[];

  beforeEach(async () => {
    const store = new MemoryStore();
    const pedersen_hasher = new StarkPedersenHasher();
    const keccak_hasher = new KeccakHasher();
    const poseidon_hasher = new StarkPoseidonHasher();


    pedersen_mmr = new CoreMMR(store, pedersen_hasher);
    keccak_mmr = new CoreMMR(store, keccak_hasher);
    poseidon_mmr = new CoreMMR(store, poseidon_hasher);
    appendsResultsForPedersen = [];
    appendsResultsForKeccak = [];
    appendsResultsForPoseidon = [];

    for (const leaf of leaves) {
      appendsResultsForPedersen.push(await pedersen_mmr.append(leaf));
      appendsResultsForKeccak.push(await keccak_mmr.append(leaf));
      appendsResultsForPoseidon.push(await poseidon_mmr.append(leaf));
    }
  });
  
  //================================================================================================
  // Tests for CoreMMR.createWithGenesis
  //================================================================================================

  it("should generate mmr with genesis for keccak hasher", async () => {
    const hasher = new KeccakHasher();
    const mmr = await CoreMMR.createWithGenesis(new MemoryStore(), hasher);
    expect(await mmr.rootHash.get()).toEqual(hasher.hash(["1", hasher.getGenesis()]));
  });

  it("should generate mmr with genesis for poseidon hasher", async () => {
    const hasher = new StarkPoseidonHasher();
    const mmr = await CoreMMR.createWithGenesis(new MemoryStore(), hasher);
    expect(await mmr.rootHash.get()).toEqual(hasher.hash(["1", hasher.getGenesis()]));
  });

   //================================================================================================
  // Tests for get root hash from createWithGenesis
  //================================================================================================

  it("should get a stable root hash for given args for keccak", async () => {
    const hasher = new KeccakHasher();
    const mmr = await CoreMMR.createWithGenesis(new MemoryStore(), hasher);

    expect(await mmr.leavesCount.get()).toEqual(1);

    await mmr.append("1");
    await mmr.append("0x1");
    await mmr.append("2");
    await mmr.append("0x2");
    await mmr.append("3");
    const appendedResult = await mmr.append("0x3");

    expect(appendedResult.leavesCount).toEqual(7);

    const stable_bag = "0x46d676ef5c3e8c6668ec577baee408f7b149d05b3ea31f4f2ad0d2a0ddc2a9b3";

    const bag = await mmr.bagThePeaks();

    const leafCount = await mmr.leavesCount.get();

    expect(bag).toEqual(stable_bag);

    const rootHash = await mmr.calculateRootHash(bag, leafCount);

    const stableRootHash = "0xe336600238639f1ea4e2d78db1c8353a896487fa8fb9f2c3898888817008b77b";
    expect(rootHash).toEqual(stableRootHash);
  });

  it("should get a stable root hash for given args for stark poseidon hasher", async () => {
    const hasher = new StarkPoseidonHasher();
    const mmr = await CoreMMR.createWithGenesis(new MemoryStore(), hasher);

    expect(await mmr.leavesCount.get()).toEqual(1);

    await mmr.append("1");
    await mmr.append("0x1");
    await mmr.append("2");
    await mmr.append("0x2");
    await mmr.append("3");
    const appendedResult = await mmr.append("0x3");

    expect(appendedResult.leavesCount).toEqual(7);

    const stable_bag = "0x1b6fe636cf8f005b539f3d5c9ca5b5f435e995ecf51894fd3045a5e8389d467";

    const bag = await mmr.bagThePeaks();

    const leafCount = await mmr.leavesCount.get();

    expect(bag).toEqual(stable_bag);

    const rootHash = await mmr.calculateRootHash(bag, leafCount);

    const stableRootHash = "0x113e2abc1e91aa48aa7c12940061c924437fcd27829b8594de54a0cea57d232";
    expect(rootHash).toEqual(stableRootHash);
  });

  //================================================================================================
  // Tests for mapElementIndexToLeafIndex
  //================================================================================================

  it("Should properly map an element index to a leaf index", () => {
    const elementIndices = [1, 2, 4, 5, 8, 9, 11, 12, 16, 17, 19];
    elementIndices.forEach((elementIndex, arrIdx) => {
      const leafIndex = CoreMMR.mapElementIndexToLeafIndex(elementIndex);
      expect(leafIndex).toEqual(arrIdx);
    });
  });

  //================================================================================================
  // Tests for append
  //================================================================================================

  it("should compute parent tree for pedersen hasher", async () => {
    const lastLeafElementIndex = appendsResultsForPedersen[appendsResultsForPedersen.length - 1].elementIndex;

    const appendedLeaf = "6";

    const hasher = new StarkPedersenHasher();
    const node3 = hasher.hash([leaves[0], leaves[1]]);
    const node6 = hasher.hash([leaves[2], leaves[3]]);
    const node7 = hasher.hash([node3, node6]);
    const node10 = hasher.hash([leaves[4], appendedLeaf]);
    const bag = hasher.hash([node7, node10]);
    const root = hasher.hash(["10", bag]);

    await expect(pedersen_mmr.append(appendedLeaf)).resolves.toEqual({
      leavesCount: 6,
      elementsCount: 10,
      elementIndex: 9,
      rootHash: root,
    } as AppendResult);

    await expect(pedersen_mmr.getPeaks()).resolves.toEqual([node7, node10]);
    await expect(pedersen_mmr.bagThePeaks()).resolves.toEqual(bag);
    const proof = await pedersen_mmr.getProof(lastLeafElementIndex);
    await expect(pedersen_mmr.verifyProof(proof, leaves[leaves.length - 1])).resolves.toEqual(true);
  });

  it("should compute parent tree for keccak hasher", async () => {
    const lastLeafElementIndex = appendsResultsForKeccak[appendsResultsForKeccak.length - 1].elementIndex;

    const appendedLeaf = "6";

    const hasher = new KeccakHasher();
    const node3 = hasher.hash([leaves[0], leaves[1]]);
    const node6 = hasher.hash([leaves[2], leaves[3]]);
    const node7 = hasher.hash([node3, node6]);
    const node10 = hasher.hash([leaves[4], appendedLeaf]);
    const bag = hasher.hash([node7, node10]);
    const root = hasher.hash(["10", bag]);

    await expect(keccak_mmr.append(appendedLeaf)).resolves.toEqual({
      leavesCount: 6,
      elementsCount: 10,
      elementIndex: 9,
      rootHash: root,
    } as AppendResult);

    await expect(keccak_mmr.getPeaks()).resolves.toEqual([node7, node10]);
    await expect(keccak_mmr.bagThePeaks()).resolves.toEqual(bag);
    const proof = await keccak_mmr.getProof(lastLeafElementIndex);
    await expect(keccak_mmr.verifyProof(proof, leaves[leaves.length - 1])).resolves.toEqual(true);
  });

  it("should compute parent tree for poseidon hasher", async () => {
    const lastLeafElementIndex = appendsResultsForPoseidon[appendsResultsForPoseidon.length - 1].elementIndex;

    const appendedLeaf = "6";

    const hasher = new StarkPoseidonHasher();
    const node3 = hasher.hash([leaves[0], leaves[1]]);
    const node6 = hasher.hash([leaves[2], leaves[3]]);
    const node7 = hasher.hash([node3, node6]);
    const node10 = hasher.hash([leaves[4], appendedLeaf]);
    const bag = hasher.hash([node7, node10]);
    const root = hasher.hash(["10", bag]);

    await expect(poseidon_mmr.append(appendedLeaf)).resolves.toEqual({
      leavesCount: 6,
      elementsCount: 10,
      elementIndex: 9,
      rootHash: root,
    } as AppendResult);

    await expect(poseidon_mmr.getPeaks()).resolves.toEqual([node7, node10]);
    await expect(poseidon_mmr.bagThePeaks()).resolves.toEqual(bag);
    const proof = await poseidon_mmr.getProof(lastLeafElementIndex);
    await expect(poseidon_mmr.verifyProof(proof, leaves[leaves.length - 1])).resolves.toEqual(true);
  });

  //================================================================================================
  // Tests for get and verify proof
  //================================================================================================


  it("should generate and verify non-expiring proofs for pedersen hash", async () => {
    const proofs = await Promise.all(
      appendsResultsForPedersen.map(({ elementIndex, elementsCount }) => pedersen_mmr.getProof(elementIndex, { elementsCount }))
    );
    const verifications = await Promise.all(
      proofs.map((proof, idx) => pedersen_mmr.verifyProof(proof, leaves[idx], { elementsCount: proof.elementsCount }))
    );

    expect(verifications.every((verification) => verification === true)).toBe(true);
  });

  it("should generate and verify non-expiring proofs for keccak hash", async () => {
    const proofs = await Promise.all(
      appendsResultsForKeccak.map(({ elementIndex, elementsCount }) => keccak_mmr.getProof(elementIndex, { elementsCount }))
    );
    const verifications = await Promise.all(
      proofs.map((proof, idx) => keccak_mmr.verifyProof(proof, leaves[idx], { elementsCount: proof.elementsCount }))
    );

    expect(verifications.every((verification) => verification === true)).toBe(true);
  });

  it("should generate and verify non-expiring proofs for poseidon hash", async () => {
    const proofs = await Promise.all(
      appendsResultsForPoseidon.map(({ elementIndex, elementsCount }) => poseidon_mmr.getProof(elementIndex, { elementsCount }))
    );
    const verifications = await Promise.all(
      proofs.map((proof, idx) => poseidon_mmr.verifyProof(proof, leaves[idx], { elementsCount: proof.elementsCount }))
    );

    expect(verifications.every((verification) => verification === true)).toBe(true);
  });

  //================================================================================================
  // Tests for get and verify multiple proofs
  //================================================================================================

  it("Should generate multiple proofs for pedersen hasher", async () => {
    const proofs = await pedersen_mmr.getProofs(appendsResultsForPedersen.map((r) => r.elementIndex));
    const verifications = await Promise.all(proofs.map((proof, idx) => pedersen_mmr.verifyProof(proof, leaves[idx])));
    expect(verifications.every((verification) => verification === true)).toBe(true);
  });

  it("Should generate multiple proofs for keccak hasher", async () => {
    const proofs = await keccak_mmr.getProofs(appendsResultsForKeccak.map((r) => r.elementIndex));
    const verifications = await Promise.all(proofs.map((proof, idx) => keccak_mmr.verifyProof(proof, leaves[idx])));
    expect(verifications.every((verification) => verification === true)).toBe(true);
  });

  it("Should generate multiple proofs for poseidon hasher", async () => {
    const proofs = await poseidon_mmr.getProofs(appendsResultsForPoseidon.map((r) => r.elementIndex));
    const verifications = await Promise.all(proofs.map((proof, idx) => poseidon_mmr.verifyProof(proof, leaves[idx])));
    expect(verifications.every((verification) => verification === true)).toBe(true);
  });

  afterEach(async () => {
    await pedersen_mmr.clear();
    await expect(pedersen_mmr.getPeaks()).resolves.toEqual([]);

    await keccak_mmr.clear();
    await expect(keccak_mmr.getPeaks()).resolves.toEqual([]);

    await poseidon_mmr.clear();
    await expect(poseidon_mmr.getPeaks()).resolves.toEqual([]);
  });
});
