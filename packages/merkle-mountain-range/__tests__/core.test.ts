import MemoryStore from "@accumulators/memory";
import { KeccakHasher, PoseidonHasher, StarkPedersenHasher, StarkPoseidonHasher } from "@accumulators/hashers";
import CoreMMR, { AppendResult, DraftMMR } from "../src";

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
      appendsResultsForPedersen.map(({ elementIndex, elementsCount }) =>
        pedersen_mmr.getProof(elementIndex, { elementsCount })
      )
    );
    const verifications = await Promise.all(
      proofs.map((proof, idx) => pedersen_mmr.verifyProof(proof, leaves[idx], { elementsCount: proof.elementsCount }))
    );

    expect(verifications.every((verification) => verification === true)).toBe(true);
  });

  it("should generate and verify non-expiring proofs for keccak hash", async () => {
    const proofs = await Promise.all(
      appendsResultsForKeccak.map(({ elementIndex, elementsCount }) =>
        keccak_mmr.getProof(elementIndex, { elementsCount })
      )
    );
    const verifications = await Promise.all(
      proofs.map((proof, idx) => keccak_mmr.verifyProof(proof, leaves[idx], { elementsCount: proof.elementsCount }))
    );

    expect(verifications.every((verification) => verification === true)).toBe(true);
  });

  it("should generate and verify non-expiring proofs for poseidon hash", async () => {
    const proofs = await Promise.all(
      appendsResultsForPoseidon.map(({ elementIndex, elementsCount }) =>
        poseidon_mmr.getProof(elementIndex, { elementsCount })
      )
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

  it("Should fail if the proof has incorrect siblings length", async () => {
    const mmr = new CoreMMR(new MemoryStore(), new StarkPedersenHasher());

    await mmr.append("1"); // 1
    await mmr.append("2"); // 2
    await mmr.append("3"); // 4

    const proof = await mmr.getProof(1);

    proof.siblingsHashes = [];
    await expect(mmr.verifyProof(proof, "3")).resolves.toEqual(false);
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

describe("Event from tx (Goerli): 0x7faa311f40d173beda8748eb03072bf0cd9047f45e4daf56c0540b3260ec075e", () => {
  const keccak_hasher = new KeccakHasher();
  const poseidon_hasher = new StarkPoseidonHasher();
  const store = new MemoryStore();

  let keccak_mmr: CoreMMR;
  let poseidon_mmr: CoreMMR;

  beforeAll(async () => {
    keccak_mmr = await CoreMMR.createWithGenesis(store, keccak_hasher, "keccak");
    poseidon_mmr = await CoreMMR.createWithGenesis(store, poseidon_hasher, "poseidon");
  });

  let blocks: Record<number, { keccak: string; poseidon: string }> = {
    9734438: {
      keccak: "0xcd5631a363d4c9bfc86d3504102595c39d7cd90a940fd165e1bdd911aa504d0a",
      poseidon: "0x07b8996d5b585da92efa32a57223dfb28fa12e6c04d36d7edb03690f03bec56",
    },
    9734439: {
      keccak: "0x62154309a502f33764c4ec3267e2cabf561dc9e428b0607f6f458942bbe0e02d",
      poseidon: "0x312134454804550b4a38e1d60dc1f0be80ff62dfea8f3c6be0c257efce3b833",
    },
    9734440: {
      keccak: "0x5104aee2cb3cc519cca3580144624c197a0e8b80ef080fe29698221f9963207d",
      poseidon: "0x6f0b4ef760469262221de032372c2a6b47b304a48b632af80611fc2e2e10b56",
    },
    9734441: {
      keccak: "0x09ab9ad1513282a5c1e1b4c15436aee479e9759712ebe6e5dbb02411537633e1",
      poseidon: "0x7f6d47c24e8723a6d6cf4ef089df0bd3ec710d5448b696e47b037109a1d04ce",
    },
    9734442: {
      keccak: "0x5cb8bb916e22e6ab4c0fca4bebc13b05dcaaa7eccacd7636b755d944de4e9217",
      poseidon: "0x38e557fbc306cbcb5964a503014b375db68a0c6786fd9c6ffc5cdd14b6c9dfc",
    },
    9734443: {
      keccak: "0x0b756461f355b8fb1a6dfdfe5d943f7c037c62b99e806a579500a8a73821e250",
      poseidon: "0x54aa6067e8c4f6bcd7c47cf7900df1d960098177e186f0c15b6a7544491b539",
    },
    9734444: {
      keccak: "0x3965b0ccf016b56564129ab0f96400c3a84a8e6fa5d25327a6a1762901ee00e9",
      poseidon: "0x2f185aa16419cad043ddb0b75a7ba0c4233d51b7fee31f1ad6680f5c2b53677",
    },
    9734445: {
      keccak: "0xbe9e359d2632091546be983f8b6488012d607d56c05599c9347fdfdbd86c1b3f",
      poseidon: "0x3ff20a1d65c24d07ebedb2de39c0a27e67808b49d1544e8ef972da1d24da302",
    },
    9734446: {
      keccak: "0xe9112c401620687b34b0fc6108f35242d32ff37914e302c423e9134851573f65",
      poseidon: "0x437048beb7e0b3f95fb670e34ac4bd2f32acf6a8ad3eb5fc08682f285ad805b",
    },
    9734447: {
      keccak: "0xd6b12b6b12b253be08a02293261f71383d6159b6339d6aeab45d91643df19bd0",
      poseidon: "0x3cd2cd10c8fedcccab3691f9852b25936ef838e0c826e39ecba3354f23664cd",
    },
  };

  let finalRoots = {
    keccak: "0xc87c3ba0942e428ad5432078aa7bb0b9d423616a3a1c8c7fc27b546a81465aaf",
    poseidon: "0x06bdd6350f4f5600876f13fb1ee9be09565e37f4ab97971268bc0eb2df5ed6b9",
  };

  it("should compute the same root hash as from chain for keccak hasher", async () => {
    let draftStore = new MemoryStore();
    let mmr = await DraftMMR.initialize(draftStore, keccak_hasher, keccak_mmr, "draft_keccak");

    for (let blockNumber of Object.keys(blocks).reverse()) {
      console.log(blockNumber);
      let { keccak } = blocks[blockNumber];
      await mmr.append(keccak);
    }

    let bag = await mmr.bagThePeaks();
    let elementsCount = await mmr.elementsCount.get();
    let calculatedRootHash = await mmr.calculateRootHash(bag, elementsCount);

    expect(calculatedRootHash).toEqual(finalRoots.keccak);
  });

  it("should compute the same root hash as from chain for poseidon hasher", async () => {
    let draftStore = new MemoryStore();
    let mmr = await DraftMMR.initialize(draftStore, poseidon_hasher, poseidon_mmr, "draft_poseidon");

    for (let blockNumber of Object.keys(blocks).reverse()) {
      let { poseidon } = blocks[blockNumber];
      await mmr.append(poseidon);
    }

    let calculatedRootHash = await mmr.calculateRootHash(await mmr.bagThePeaks(), await mmr.elementsCount.get());

    expect(calculatedRootHash).toEqual(
      //? Strip padding
      finalRoots.poseidon.replace(/^0x0*/, "0x")
    );
  });
});
