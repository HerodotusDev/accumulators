import { Poseidon2Hasher } from "../src";

describe("Poseidon2 Hash", () => {
  it("Should compute a hash", () => {
    const hasher = new Poseidon2Hasher();
    const a = "0x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d17761";
    const b = "0x0194791558611599fe4ae0fcfa48f095659c90db18e54de86f2d2f547f7369bf";

    expect(hasher.isElementSizeValid(a)).toBeTruthy();
    expect(hasher.isElementSizeValid(b)).toBeTruthy();

    expect(hasher.hash([a, b])).toEqual("0x187f8180e87534c52b2bba3dafac1760e1d9369b90d118edcc7b4681a2e970bb");
  });

  it("Should correctly compute a hash of a single element", () => {
    const hasher = new Poseidon2Hasher();
    const a = "0x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d17761";

    expect(hasher.isElementSizeValid(a)).toBeTruthy();
    expect(hasher.hash([a])).toEqual("0x1497b53db38b8fc4dc0fad74b92aeab11fdc599c42ac53fe9c5d95f939e116c8");
  });

  it("Should apply optional left padding", () => {
    const hasherWithoutPad = new Poseidon2Hasher(false);
    const hasherWithPad = new Poseidon2Hasher(true);

    expect(hasherWithoutPad.hash(["0x1", "0x2"])).toEqual(
      "0x38682aa1cb5ae4e0a3f13da432a95c77c5c111f6f030faf9cad641ce1ed7383"
    );
    expect(hasherWithPad.hash(["0x1", "0x2"])).toEqual(
      "0x038682aa1cb5ae4e0a3f13da432a95c77c5c111f6f030faf9cad641ce1ed7383"
    );
  });

  it("Should throw for invalid element size", () => {
    const hasher = new Poseidon2Hasher();
    const a = `0x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf40x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4`;
    const b = "0x0194791558611599fe4ae0fcfa48f095659c90db18e54de86f2d2f547f7369bf";

    expect(hasher.isElementSizeValid(a)).toBeFalsy();
    expect(hasher.isElementSizeValid(b)).toBeTruthy();

    expect(() => hasher.hash([a, b])).toThrowError("Poseidon2 Hasher only accepts elements of size");
  });
});
