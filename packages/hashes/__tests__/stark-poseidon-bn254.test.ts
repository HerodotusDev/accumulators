import { StarkPoseidonBN254Hasher } from "../src";

describe("Stark Poseidon Hash", () => {
  it("Should compute a hash", () => {
    const hasher = new StarkPoseidonBN254Hasher();
    const a = "0x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d17761";
    const b = "0x0194791558611599fe4ae0fcfa48f095659c90db18e54de86f2d2f547f7369bf";

    expect(hasher.isElementSizeValid(a)).toBeTruthy();
    expect(hasher.isElementSizeValid(b)).toBeTruthy();

    expect(hasher.hash([a, b])).toEqual("0x16f02e8add49962d6003bb2ae7cc4bdad54077c1f9ec827867177f69df850217");
  });

  it("Should throw", () => {
    const hasher = new StarkPoseidonBN254Hasher();
    const a = `0x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf40x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4`;
    const b = "0x0194791558611599fe4ae0fcfa48f095659c90db18e54de86f2d2f547f7369bf";

    expect(hasher.isElementSizeValid(a)).toBeFalsy();

    expect(() => hasher.hash([a, b])).toThrowError("Stark Poseidon BN254 Hasher only accepts elements of size");
  });
});
