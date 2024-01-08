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

  it("Should correctly get genesis block hash", () => {
    const hasher = new StarkPoseidonHasher();
    expect(hasher.getGenesis()).toEqual("0x2241b3b7f1c4b9cf63e670785891de91f7237b1388f6635c1898ae397ad32dd");
  });

  it("Should throw for invalid element size", () => {
    const hasher = new StarkPoseidonHasher();
    const a = `0x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf40x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d177610x6109f1949f6a7555eccf4`;
    const b = "0x0194791558611599fe4ae0fcfa48f095659c90db18e54de86f2d2f547f7369bf";

    expect(hasher.isElementSizeValid(a)).toBeFalsy();
    expect(hasher.isElementSizeValid(b)).toBeTruthy();

    expect(() => hasher.hash([a, b])).toThrowError("Stark Poseidon Hasher only accepts elements of size");

    const c = `0xF90236A0B4147A5CA877AA084F4AF2FA2B22C72230EA7601CF97ECE9F11E1E0DA9A2A8BEA01DCC4DE8DEC75D7AAB85B567B6CCD41AD312451B948A7413F0A142FD40D49347949029C772DDE847622DF1553ED9D9BDB7812E4F93A06B4FDB0BECCCB76D13D048657A1AA20BA82B0F002E685D76ECADCF559668A947A02BC3BFD4CAC1EB2468012BF2ACB24740ED7623E7D193AF6293042835D03DC232A0B7E2A4E26D596590F14B7F67249CE1B9CA08134879BF1945267C9C616248C81BB901006268004261112281700006258DA100EAD20081200C00110001884E108016190808108808602628835878E20040222040C1001410A284202A8000A644902830020B13419C4E68229A51A03B0D022002A4968006C050462022004114448028510200082190020245400302188494000B138642A4A04801240A1E20483004280308884CA318000648002C060020142B1024580440098940001800C84152342004941A0C10E10920003808B01608994C08042441642E802C044A460A005A522082580901486B012002413205901A22049E402442E40609608214302444C60B8020A448100019200479210046810449000050C80B5A02D009E056000BA30643C046A0808396B6678401C9C38083A78A8784652D4EA099D883010C00846765746888676F312E32302E37856C696E7578A045B5A59855191A6F7BC51333057ED664A1F506DB86CA86BA7F1B8B22ED09F1558800000000000000000CA04A6437B1534900F6AA5B27BF0F8B817494C4895860B513E6DB94B715AEB4A014`;
    expect(hasher.isElementSizeValid(c)).toBeFalsy();

    expect(() => hasher.hash([c])).toThrowError("Stark Poseidon Hasher only accepts elements of size");
  
  });

  it("Should correctly compute a hash of a single element", () => {
    const hasher = new StarkPoseidonHasher();
    const a = "0x6109f1949f6a7555eccf4e15ce1f10fbd78091dfe715cc2e0c5a244d9d17761";

    expect(hasher.isElementSizeValid(a)).toBeTruthy();

    expect(hasher.hash([a])).toEqual("0x5d685fd03936a3f5151bb39d8ff837ad8874306d191fc58a044521da1d30fad");

    const b = "0x0194791558611599fe4ae0fcfa48f095659c90db18e54de86f2d2f547f7369bf";

    expect(hasher.isElementSizeValid(b)).toBeTruthy();

    expect(hasher.hash([b])).toEqual("0x4ef2629853adf5f5377deba20f7cc4e3e37b5a5aa9f989c2020ac2d15693e7");
  });

  it("Should correctly apply padding of 2 elements", () => {
    const hasher = new StarkPoseidonHasher();
    const a = "3";
    const b = "4";

    expect(hasher.isElementSizeValid(a)).toBeTruthy();
    expect(hasher.isElementSizeValid(b)).toBeTruthy();

    const result1 = hasher.hash([a, b]);

    expect(result1).toEqual("0x508c780b8cd26ffaa0ba03933770a02987d3d94870e70bc388f9bef69af180d");

    const c = "0x3";
    const d = "0x4";

    expect(hasher.isElementSizeValid(c)).toBeTruthy();
    expect(hasher.isElementSizeValid(d)).toBeTruthy();

    const result2 = hasher.hash([c, d]);
    expect(result2).toEqual("0x508c780b8cd26ffaa0ba03933770a02987d3d94870e70bc388f9bef69af180d");

    const e = "0x000000003";
    const f = "0x000000004";

    expect(hasher.isElementSizeValid(e)).toBeTruthy();
    expect(hasher.isElementSizeValid(f)).toBeTruthy();

    const result3 = hasher.hash([e, f]);
    expect(result3).toEqual("0x508c780b8cd26ffaa0ba03933770a02987d3d94870e70bc388f9bef69af180d");
  });

  it("Should correctly apply padding of one element", () => {
    const hasher = new StarkPoseidonHasher();
    const a = "3";

    expect(hasher.isElementSizeValid(a)).toBeTruthy();

    const result1= hasher.hash([a])
    expect(result1).toEqual("0x522ce35ecb769b5017959d77720ea484b8b8929314a678f2b1b363e4a75bbe1");

    const b = "0x3";

    expect(hasher.isElementSizeValid(b)).toBeTruthy();

    const result2= hasher.hash([b])
    expect(result2).toEqual("0x522ce35ecb769b5017959d77720ea484b8b8929314a678f2b1b363e4a75bbe1");
  });

  it("Should return error on empty array", () => {
    const hasher = new StarkPoseidonHasher();
    const a = [];
    expect(() => hasher.hash(a)).toThrowError("Stark Poseidon Hasher only accepts arrays of size 1 or greater");
  });

  it("Hashes a combination of hex, number as string", () => {
    const hasher = new StarkPoseidonHasher();

    const hash = hasher.hash(["0x1", "1", "0x2", "2", "0x3", "3", "0x4", "4"]);

    expect(hash).toEqual("0x2de470542009171446e0c9964111c7efdd61db18e5e10b0a507b1c2352e6458");
  });


});
