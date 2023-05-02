import { StarkPoseidonHasher } from "../src";

describe("Stark Poseidon Hash", () => {
  it("Should compute a hash", () => {
    const hasher = new StarkPoseidonHasher();
    const a = "0x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d17761";
    const b = "0x0194791558611599fe4ae0fcfa48f095659c90db18e54de86f2d2f547f7369bf";

    expect(hasher.isElementSizeValid(a)).toBeTruthy();
    expect(hasher.isElementSizeValid(b)).toBeTruthy();

    expect(hasher.hash([a, b])).toEqual("0x7b8180db85fa1e0b5041f38f57926743905702c498576991f04998b5d9476b4");
  });

  it("Should throw", () => {
    const hasher = new StarkPoseidonHasher();
    const a = `0x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf40x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4`;
    const b = "0x0194791558611599fe4ae0fcfa48f095659c90db18e54de86f2d2f547f7369bf";

    expect(hasher.isElementSizeValid(a)).toBeFalsy();

    expect(() => hasher.hash([a, b])).toThrowError("Stark Poseidon Hasher only accepts elements of size");
  });
});
