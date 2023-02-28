import { CoreMMR } from "../src";

describe("core", () => {
  const database = {};
  const store = {
    get: (key: string) => database[key],
    set: (key: string, value: string) => (database[key] = value),
    delete: (key: string) => delete database[key],
  };
  const hasher = it("should check if 1 == 1", () => {
    expect(1).toBe(1);
  });
});
