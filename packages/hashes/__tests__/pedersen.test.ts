import { StarkPedersenHasher } from "../src";

describe("Simple Pedersen Hash", () => {
  it("Should compute a hash", () => {
    const hasher = new StarkPedersenHasher();
    const a = "10";
    const b = "20";
    expect(hasher.hash([a, b])).toEqual("0x0194791558611599fe4ae0fcfa48f095659c90db18e54de86f2d2f547f7369bf");
  });
});
