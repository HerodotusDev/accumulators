import { KeccakHasher } from "../src";

describe("Simple Keccak Hash", () => {
  it("Should correctly compute a hash", () => {
    const hasher = new KeccakHasher();
    const a = "0xa4b1d5793b631de611c922ea3ec938b359b3a49e687316d9a79c27be8ce84590";
    const b = "0xa4b1d5793b631de611c922ea3ec938b359b3a49e687316d9a79c27be8ce84590";

    expect(hasher.isElementSizeValid(a)).toBeTruthy();
    expect(hasher.isElementSizeValid(b)).toBeTruthy();

    expect(hasher.hash([a, b])).toEqual("0xa960dc82e45665d5b1340ee84f6c3f27abaac8235a1a3b7e954001c1bc682268");
  });

  it("Should correctly apply padding", () => {
    const hasher = new KeccakHasher();
    const a = "3";
    const b = "4";
    hasher.hash([a, b]);
  });
});
