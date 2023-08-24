import SQLiteStore from "../src";

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

  it("should delete a value", async () => {
    await store.set("key", "value");
    await store.delete("key");
    const value = await store.get("key");
    expect(value).toEqual(undefined);
  });
});
