import CoreMMR, { DraftMMR } from "../src";
import { StarkPedersenHasher, KeccakHasher, StarkPoseidonHasher } from "@accumulators/hashers";
import MemoryStore from "@accumulators/memory";

const store = new MemoryStore();
const storeDraft = new MemoryStore();
const hasher = new StarkPedersenHasher();

describe("precomputation", () => {
  let mmr: CoreMMR;
  const rootAt6Leaves = "0x03203d652ecaf8ad941cbbccddcc0ce904d81e2c37e6dcff4377cf988dac493c";

  beforeEach(async () => {
    mmr = new CoreMMR(store, hasher);
    await mmr.append("1");
    await mmr.append("2");
    await mmr.append("3");
  });

  it("should compute parent tree", async () => {
    await mmr.append("4");
    const { elementIndex } = await mmr.append("5");
    await mmr.append("6");

    await expect(mmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const proof = await mmr.getProof(elementIndex);
    await expect(mmr.verifyProof(proof, "5")).resolves.toEqual(true);
  });

  it("should precompute from parent tree", async () => {
    const precomputationMmr = await DraftMMR.initialize(storeDraft, hasher, mmr, "precomputed");

    await precomputationMmr.append("4");
    const { elementIndex } = await precomputationMmr.append("5");
    await precomputationMmr.append("6");

    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const proof = await precomputationMmr.getProof(elementIndex);
    await expect(precomputationMmr.verifyProof(proof, "5")).resolves.toEqual(true);

    await precomputationMmr.discard();
    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual("0x0");

    //? After closing the precomputation, the parent MMR should still work
    await mmr.append("4");
    const { elementIndex: parentLeafElementIndex } = await mmr.append("5");
    await mmr.append("6");
    await expect(mmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const parentProof = await mmr.getProof(parentLeafElementIndex);
    await expect(mmr.verifyProof(parentProof, "5")).resolves.toEqual(true);
  });

  it("should apply Draft mmr", async () => {
    const precomputationMmr = await DraftMMR.initialize(storeDraft, hasher, mmr, "precomputed");

    await precomputationMmr.append("4");
    const { elementIndex } = await precomputationMmr.append("5");
    await precomputationMmr.append("6");

    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const proof = await precomputationMmr.getProof(elementIndex);
    await expect(precomputationMmr.verifyProof(proof, "5")).resolves.toEqual(true);

    await precomputationMmr.apply();
    //? After applying the precomputation, the parent MMR should work
    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual("0x0");
    await expect(mmr.bagThePeaks()).resolves.toEqual(rootAt6Leaves);
    const parentProof = await mmr.getProof(elementIndex);
    await expect(mmr.verifyProof(parentProof, "5")).resolves.toEqual(true);
  });
});

describe("empty mmr", () => {
  let mmr: CoreMMR;

  beforeEach(async () => {
    mmr = new CoreMMR(store, hasher);
  });

  it("should precompute from empty mmr", async () => {
    const precomputationMmr = await DraftMMR.initialize(storeDraft, hasher, mmr, "precomputed");

    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual("0x0");

    await precomputationMmr.append("1");
    await precomputationMmr.append("2");

    await expect(precomputationMmr.bagThePeaks()).resolves.toEqual(
      "0x05bb9440e27889a364bcb678b1f679ecd1347acdedcbf36e83494f857cc58026"
    );

    await precomputationMmr.discard();
  });
});

it("should generate mmr with genesis for keccak hasher", async () => {
  const hasher = new KeccakHasher();
  const store = new MemoryStore();
  const mmr = await CoreMMR.createWithGenesis(store, hasher);
  const precomputationMmr = await DraftMMR.initialize(store, hasher, mmr, "precomputed");

   // block 9734438
  await precomputationMmr.append("0xcd5631a363d4c9bfc86d3504102595c39d7cd90a940fd165e1bdd911aa504d0a");
  expect(await precomputationMmr.leavesCount.get()).toEqual(2);
  expect(await precomputationMmr.elementsCount.get()).toEqual(3);
  expect(await precomputationMmr.rootHash.get()).toEqual("0xffbb02de013f6837d8e0da5f4215c53634c32a4f5eb2520f26a1d6d2f615db72");
  
   // block 9734439
  await precomputationMmr.append("0x62154309a502f33764c4ec3267e2cabf561dc9e428b0607f6f458942bbe0e02d");
  expect(await precomputationMmr.leavesCount.get()).toEqual(3);
  expect(await precomputationMmr.elementsCount.get()).toEqual(4);
  expect(await precomputationMmr.rootHash.get()).toEqual("0xaeb642d0f47f806382c66494ccf42c7d37eb3e09ba507a3b842e2a080c745200");
    
  // block 9734440
  await precomputationMmr.append("0x5104aee2cb3cc519cca3580144624c197a0e8b80ef080fe29698221f9963207d");
  expect(await precomputationMmr.leavesCount.get()).toEqual(4);
  expect(await precomputationMmr.elementsCount.get()).toEqual(7);
  expect(await precomputationMmr.rootHash.get()).toEqual("0xdae951c569985cea6033958972846338710ba372aef365053428d1eccfe5e5ce");

  // block 9734441
  await precomputationMmr.append("0x09ab9ad1513282a5c1e1b4c15436aee479e9759712ebe6e5dbb02411537633e1");
  expect(await precomputationMmr.leavesCount.get()).toEqual(5);
  expect(await precomputationMmr.elementsCount.get()).toEqual(8);
  expect(await precomputationMmr.rootHash.get()).toEqual("0xd4675f556d04ea6828165e6ad778f3162978588890061692189a55002d93572a");

  // block 9734442
  await precomputationMmr.append("0x5cb8bb916e22e6ab4c0fca4bebc13b05dcaaa7eccacd7636b755d944de4e9217");
  expect(await precomputationMmr.leavesCount.get()).toEqual(6);
  expect(await precomputationMmr.elementsCount.get()).toEqual(10);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x70c01463d822d2205868c5a46eefc55658828015b83e4553c8462d2c6711d0e0");
  const peaks = await precomputationMmr.getPeaks();
  expect(peaks).toEqual(["0xbd946409a993b84d18be8dc09081a9cdcecedfedf3a1ff984175e5f3667af887", "0x9cfabdfca79eb1ae44266614b731aa30d2aed697fa01d83b933498f1095f0941"]);
  expect(precomputationMmr.hasher.hash(["10",hasher.hash(peaks)])).toEqual("0x70c01463d822d2205868c5a46eefc55658828015b83e4553c8462d2c6711d0e0");
  
  // block 9734443
  await precomputationMmr.append("0x0b756461f355b8fb1a6dfdfe5d943f7c037c62b99e806a579500a8a73821e250");
  expect(await precomputationMmr.leavesCount.get()).toEqual(7);
  expect(await precomputationMmr.elementsCount.get()).toEqual(11);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x7d0011a4256839263340fb483eb9fe3f6ce8506c9cc39699d8c1a65d8f34257a");

  // block 9734444
  await precomputationMmr.append("0x3965b0ccf016b56564129ab0f96400c3a84a8e6fa5d25327a6a1762901ee00e9");
  expect(await precomputationMmr.leavesCount.get()).toEqual(8);
  expect(await precomputationMmr.elementsCount.get()).toEqual(15);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x961d2a731654c2d9027c787a9296c66f841d1ee4a13abfdf7a83b70fd7217060");

  // block 9734445
  await precomputationMmr.append("0xbe9e359d2632091546be983f8b6488012d607d56c05599c9347fdfdbd86c1b3f");
  expect(await precomputationMmr.leavesCount.get()).toEqual(9);
  expect(await precomputationMmr.elementsCount.get()).toEqual(16);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x4226038dc6fba77fa92ce5d63a49945266065914571c59ef85bdf184eee6dc36");

   // block 9734446
  await precomputationMmr.append("0xe9112c401620687b34b0fc6108f35242d32ff37914e302c423e9134851573f65");
  expect(await precomputationMmr.leavesCount.get()).toEqual(10);
  expect(await precomputationMmr.elementsCount.get()).toEqual(18);
  expect(await precomputationMmr.rootHash.get()).toEqual("0xc5cce3ec5640e0165df5cf8aa5897eb7b9b54b6c4a17d13e0a007b12cfc223cd");

   // block 9734447
  await precomputationMmr.append("0xd6b12b6b12b253be08a02293261f71383d6159b6339d6aeab45d91643df19bd0");
  expect(await precomputationMmr.leavesCount.get()).toEqual(11);
  expect(await precomputationMmr.elementsCount.get()).toEqual(19);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x4654b1a9b7311b0b896ada391a9481db2c0756d9c0f32658facff9eec32cd18b");

  const elementsCount = await precomputationMmr.elementsCount.get();
  const bag = await precomputationMmr.bagThePeaks(elementsCount);
  const rootHash = await precomputationMmr.calculateRootHash(bag, elementsCount);

  //TODO: onchain root should be 0xc87c3ba0942e428ad5432078aa7bb0b9d423616a3a1c8c7fc27b546a81465aaf
  expect(rootHash).toEqual("0x4654b1a9b7311b0b896ada391a9481db2c0756d9c0f32658facff9eec32cd18b");
});

it("should generate mmr with genesis for poseidon hasher", async () => {
  const hasher = new StarkPoseidonHasher(true);
  const store = new MemoryStore();
  const mmr = await CoreMMR.createWithGenesis(store, hasher);
  const precomputationMmr = await DraftMMR.initialize(store, hasher, mmr, "precomputed");

   // block 9734438
  await precomputationMmr.append("0x07b8996d5b585da92efa32a57223dfb28fa12e6c04d36d7edb03690f03bec56");
  expect(await precomputationMmr.leavesCount.get()).toEqual(2);
  expect(await precomputationMmr.elementsCount.get()).toEqual(3);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x1070995027591e1b97c73c0e59933ee1a4227781434dd94b2d4dc87fd94cf92");
  
   // block 9734439
  await precomputationMmr.append("0x312134454804550b4a38e1d60dc1f0be80ff62dfea8f3c6be0c257efce3b833");
  expect(await precomputationMmr.leavesCount.get()).toEqual(3);
  expect(await precomputationMmr.elementsCount.get()).toEqual(4);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x1a2be63d0560708d3eb87319be0442016ba8757557da8009096e95c4b0682d9");
    
  // block 9734440
  await precomputationMmr.append("0x6f0b4ef760469262221de032372c2a6b47b304a48b632af80611fc2e2e10b56");
  expect(await precomputationMmr.leavesCount.get()).toEqual(4);
  expect(await precomputationMmr.elementsCount.get()).toEqual(7);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x1006c333b41230ee484977b481e0e4e530f454a6d14902ce593ed2dbf649a25");

  // block 9734441
  await precomputationMmr.append("0x7f6d47c24e8723a6d6cf4ef089df0bd3ec710d5448b696e47b037109a1d04ce");
  expect(await precomputationMmr.leavesCount.get()).toEqual(5);
  expect(await precomputationMmr.elementsCount.get()).toEqual(8);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x4f05ebf1a932fdc481d43eb577ad326e5a8c743fbc8624eb98010b65f8c5b89");

  // block 9734442
  await precomputationMmr.append("0x38e557fbc306cbcb5964a503014b375db68a0c6786fd9c6ffc5cdd14b6c9dfc");
  expect(await precomputationMmr.leavesCount.get()).toEqual(6);
  expect(await precomputationMmr.elementsCount.get()).toEqual(10);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x13bdeaf86b66a03cb316c62d475a7e8d037d30ee7b5d52ff1b13f2fb951b527");

  // block 9734443
  await precomputationMmr.append("0x54aa6067e8c4f6bcd7c47cf7900df1d960098177e186f0c15b6a7544491b539");
  expect(await precomputationMmr.leavesCount.get()).toEqual(7);
  expect(await precomputationMmr.elementsCount.get()).toEqual(11);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x763a6f33c8cf7b1411cf23910ddba74841dc4b52c73ecfb57ddc40160c78fc6");

  // block 9734444
  await precomputationMmr.append("0x2f185aa16419cad043ddb0b75a7ba0c4233d51b7fee31f1ad6680f5c2b53677");
  expect(await precomputationMmr.leavesCount.get()).toEqual(8);
  expect(await precomputationMmr.elementsCount.get()).toEqual(15);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x7abaf3802dee5c46f80d30101a3882645070d0968758b2a9b7a3bc5e1a059fa");

  // block 9734445
  await precomputationMmr.append("0x3ff20a1d65c24d07ebedb2de39c0a27e67808b49d1544e8ef972da1d24da302");
  expect(await precomputationMmr.leavesCount.get()).toEqual(9);
  expect(await precomputationMmr.elementsCount.get()).toEqual(16);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x27f8b7a2ed6d1290833c6fa587d564a8810ee1925b1b2cdfde8da1cefdee57b");

   // block 9734446
  await precomputationMmr.append("0x437048beb7e0b3f95fb670e34ac4bd2f32acf6a8ad3eb5fc08682f285ad805b");
  expect(await precomputationMmr.leavesCount.get()).toEqual(10);
  expect(await precomputationMmr.elementsCount.get()).toEqual(18);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x2c02006787d05a482e0a19771a82c353d65a8eff7e69e1be9ae2219d0400951");

   // block 9734447
  await precomputationMmr.append("0x3cd2cd10c8fedcccab3691f9852b25936ef838e0c826e39ecba3354f23664cd");
  expect(await precomputationMmr.leavesCount.get()).toEqual(11);
  expect(await precomputationMmr.elementsCount.get()).toEqual(19);
  expect(await precomputationMmr.rootHash.get()).toEqual("0x2ca29d4ac90ce8715232f2af120c77a4d647771d76e0720afc1fd330aa64577");

  const elementsCount = await precomputationMmr.elementsCount.get();
  const bag = await precomputationMmr.bagThePeaks(elementsCount);
  const rootHash = await precomputationMmr.calculateRootHash(bag, elementsCount);

  //TODO: onchain root should be 0x06bdd6350f4f5600876f13fb1ee9be09565e37f4ab97971268bc0eb2df5ed6b9
  expect(rootHash).toEqual("0x2ca29d4ac90ce8715232f2af120c77a4d647771d76e0720afc1fd330aa64577");
});

afterAll(async () => {
  await expect(storeDraft.store.size).toBe(0);
});
