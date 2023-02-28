import { StarkPedersenHasher } from "../src";

describe("Simple Pedersen Hash", () => {
  it("Should compute a hash", () => {
    const hasher = new StarkPedersenHasher();
    const a = "10";
    const b = "20";
    hasher.hash([a, b]);
  });
});
