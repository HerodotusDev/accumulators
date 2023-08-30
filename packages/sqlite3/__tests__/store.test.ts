import SQLiteStore from "../src";

import CoreMMR, { PrecomputationMMR } from "@accumulators/merkle-mountain-range";
import { StarkPoseidonHasher } from "@accumulators/hashers";

describe("SQLite3: In memory Database interactions", () => {
  let store: SQLiteStore;

  beforeEach(async () => {
    store = new SQLiteStore(":memory:");
    await store.init();
  });

  it("should set and get a value", async () => {
    await store.set("key", "value");
    const value = await store.get("key");
    expect(value).toEqual("value");
  });

  it("should set and get many values", async () => {
    const entries = new Map<string, string>();
    entries.set("key1", "value1");
    entries.set("key2", "value2");
    await store.setMany(entries);

    const values = await store.getMany(["key1", "key2"]);
    expect(values.get("key1")).toEqual("value1");
  });

  it("should get many values in correct order", async () => {
    const entries = new Map<string, string>();
    entries.set("a", "value1");
    entries.set("b", "value2");
    entries.set("10", "value3");
    entries.set("5", "value4");
    await store.setMany(entries);

    const keysToGet = ["5", "10", "b", "a"];
    const res = await store.getMany(keysToGet);
    const keysGot = [...res.keys()];

    expect(keysGot).toEqual(keysToGet);
  });

  it("should delete a value", async () => {
    await store.set("key", "value");
    await store.delete("key");
    const value = await store.get("key");
    expect(value).toEqual(undefined);
  });
});

describe("SQLite3: In persistent Database interactions", () => {
  let store: SQLiteStore;

  beforeEach(async () => {
    store = new SQLiteStore("./test.sql");
    await store.init();
  });

  it("should set and get a value", async () => {
    await store.set("key", "value");
    const value = await store.get("key");
    expect(value).toEqual("value");
  });

  it("should set and get many values", async () => {
    const entries = new Map<string, string>();
    entries.set("key1", "value1");
    entries.set("key2", "value2");
    await store.setMany(entries);

    const values = await store.getMany(["key1", "key2"]);
    expect(values.get("key1")).toEqual("value1");
  });

  it("should get many values in correct order", async () => {
    const entries = new Map<string, string>();
    entries.set("a", "value1");
    entries.set("b", "value2");
    entries.set("10", "value3");
    entries.set("5", "value4");
    await store.setMany(entries);

    const keysToGet = ["5", "10", "b", "a"];
    const res = await store.getMany(keysToGet);
    const keysGot = [...res.keys()];

    expect(keysGot).toEqual(keysToGet);
  });

  it("should delete a value", async () => {
    await store.set("key", "value");
    await store.delete("key");
    const value = await store.get("key");
    expect(value).toEqual(undefined);
  });
});

describe("SQLite3 stored MMR", () => {
  const hasher = new StarkPoseidonHasher();
  const store = new SQLiteStore(":memory:");

  let mmr: CoreMMR;

  beforeEach(async () => {
    await store.init();
    mmr = new CoreMMR(store, hasher);
  });

  it("Should append to the mmr", async () => {
    await mmr.append("4");
    await mmr.append("5");
    await mmr.append("6");

    const root = await mmr.bagThePeaks();
    expect(root).toBeDefined();
  });

  it("Should append a duplicate the mmr", async () => {
    await mmr.append("4");
    await mmr.append("4");

    const root = await mmr.bagThePeaks();
    expect(root).toBeDefined();
  });
});

describe("SQLite3 stored MMR: precomputation", () => {
  const hasher = new StarkPoseidonHasher();
  const store = new SQLiteStore(":memory:");

  let mmr: CoreMMR;

  beforeEach(async () => {
    await store.init();
    mmr = new CoreMMR(store, hasher);
    await mmr.append("1");
    await mmr.append("2");
    await mmr.append("3");
  });

  it("Should append to the mmr", async () => {
    const precomputationMmr = await PrecomputationMMR.initialize(store, hasher, mmr.mmrId, "precomputed");

    await precomputationMmr.append("4");
    await precomputationMmr.append("5");
    await precomputationMmr.append("6");

    const proof = await precomputationMmr.getProof(8);
    await expect(precomputationMmr.verifyProof(proof, "5")).resolves.toEqual(true);

    await precomputationMmr.close();
  });
});
