import { KeccakHasher } from "../src";

describe("Simple Keccak Hash", () => {
  it("Should correctly compute a hash", () => {
    const hasher = new KeccakHasher();
    const a = "0xa4b1d5793b631de611c922ea3ec938b359b3a49e687316d9a79c27be8ce84590";
    const b = "0xa4b1d5793b631de611c922ea3ec938b359b3a49e687316d9a79c27be8ce84590";

    expect(hasher.isElementSizeValid(a)).toBeTruthy();
    expect(hasher.isElementSizeValid(b)).toBeTruthy();

    expect(hasher.hash([a, b])).toEqual("0xa960dc82e45665d5b1340ee84f6c3f27abaac8235a1a3b7e954001c1bc682268");

    // Should be able to hash a RLP-encoded block header
    const rawHexRlp =
      "0xf9022ca0b8ac881ac6d93bb79b9610fefecfcdfa4716a31ab1c2c63e9a0acd007efe91fda01dcc4de8dec75d7aab85b567b6ccd41ad312451b948a7413f0a142fd40d4934794000095e79eac4d76aab57cb2c1f091d553b36ca0a05ab953427f125b96a466204e7611ab2aa5dd1f38106776406061a7bc0d99ec4aa0cdd691b4418ba6e18aa8c28420185c77dccbbb7b74bc5a15a612f00fa8bf70aca00a3c0feb385283236f840d09bb11322cb7ccd38d9435b0110352b89a157eb30cb9010000fd48c020a0644402118038855d20c410ad10102a40599c20f98850d873110d32231461d31002310090c8089d044cd742421236020238749110de1690240660c0f26032df72038d5b10130bb20a936e2c059a302060f4898450c1e4a08888a96b411104b6064020084809bd10110db011189004402867c008e26e134800140b1f8322708084902a01440248ca000426326d5005431d2e88290785483042c0c6060518963460121100a008620191430072400a07a0862314010b1d2f003a0206993150131150a008104263498d136404ad8c908c18802230230f3e324c82b5281c10b92d30308e75b0392b2020011404841130564a3106c04802410007805ba38083883dcb8401c9c38083cbd94a846450fab08a4e65746865726d696e64a00d14206369368fdacbdb2035f756fffa2c32fb37fdd6acc2ad87e0f5e634e23f880000000000000000850213e9b610a039286c1612bea6175976e164b69f02850406743b60cc67a0a902892689472b27";

    hasher.hash([rawHexRlp]);
  });

  it("Should correctly compute a hash of non hex with hex", () => {
    const hasher = new KeccakHasher();
    const a = "0xbd946409a993b84d18be8dc09081a9cdcecedfedf3a1ff984175e5f3667af887";
    const b = "0x9cfabdfca79eb1ae44266614b731aa30d2aed697fa01d83b933498f1095f0941";

    expect(hasher.isElementSizeValid(a)).toBeTruthy();
    expect(hasher.isElementSizeValid(b)).toBeTruthy();

    const result = hasher.hash([a, b]);
    expect(result).toEqual("0xead5d1fa438c36f2c341756e97b2327214f21fee27aaeae4c91238c2c76374f5");

    expect(hasher.hash(["10", result])).toEqual("0x70c01463d822d2205868c5a46eefc55658828015b83e4553c8462d2c6711d0e0");
  });

  it("Should correctly compute a hash of a single element", () => {
    const hasher = new KeccakHasher();
    const a = "0xa4b1d5793b631de611c922ea3ec938b359b3a49e687316d9a79c27be8ce84590";

    expect(hasher.isElementSizeValid(a)).toBeTruthy();

    expect(hasher.hash([a])).toEqual("0xee8c63253612ab4d2d00a272712aab9877a4bf43023e5cb1b41087bc1ccff6d9");
  });

  it("Should correctly apply padding", () => {
    const hasher = new KeccakHasher();
    const a = "3";
    const b = "4";

    const result = hasher.hash([a, b]);

    expect(result).toEqual("0x2e174c10e159ea99b867ce3205125c24a42d128804e4070ed6fcc8cc98166aa0");
  });

  it("Should fail on non hex encoded string of single value", () => {
    const hasher = new KeccakHasher();
    const a = "3";

    expect(() => hasher.hash([a])).toThrow();
  });

  it("Should handle empty array", () => {
    const hasher = new KeccakHasher();
    const a = [];

    expect(hasher.hash(a)).toEqual("0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470");
  });

  it("Should correctly get genesis block hash", () => {
    const hasher = new KeccakHasher();
    expect(hasher.getGenesis()).toEqual("0xce92cc894a17c107be8788b58092c22cd0634d1489ca0ce5b4a045a1ce31b168");
  });

  it("Should correctly hash RLP of 9877095 block", () => {
    const rlp =
      "0xF90236A0B4147A5CA877AA084F4AF2FA2B22C72230EA7601CF97ECE9F11E1E0DA9A2A8BEA01DCC4DE8DEC75D7AAB85B567B6CCD41AD312451B948A7413F0A142FD40D49347949029C772DDE847622DF1553ED9D9BDB7812E4F93A06B4FDB0BECCCB76D13D048657A1AA20BA82B0F002E685D76ECADCF559668A947A02BC3BFD4CAC1EB2468012BF2ACB24740ED7623E7D193AF6293042835D03DC232A0B7E2A4E26D596590F14B7F67249CE1B9CA08134879BF1945267C9C616248C81BB901006268004261112281700006258DA100EAD20081200C00110001884E108016190808108808602628835878E20040222040C1001410A284202A8000A644902830020B13419C4E68229A51A03B0D022002A4968006C050462022004114448028510200082190020245400302188494000B138642A4A04801240A1E20483004280308884CA318000648002C060020142B1024580440098940001800C84152342004941A0C10E10920003808B01608994C08042441642E802C044A460A005A522082580901486B012002413205901A22049E402442E40609608214302444C60B8020A448100019200479210046810449000050C80B5A02D009E056000BA30643C046A0808396B6678401C9C38083A78A8784652D4EA099D883010C00846765746888676F312E32302E37856C696E7578A045B5A59855191A6F7BC51333057ED664A1F506DB86CA86BA7F1B8B22ED09F1558800000000000000000CA04A6437B1534900F6AA5B27BF0F8B817494C4895860B513E6DB94B715AEB4A014";

    const hasher = new KeccakHasher();
    const new_hash = hasher.hash([rlp]);

    const etherscan_verified_hash_of_9877095_block =
      "0xfc9515e185a5a1b88dfb1708d397339019ce947083fc7ad64b048f885d48a9cc";

    expect(new_hash).toEqual(etherscan_verified_hash_of_9877095_block);
  });

  it("Hashes a combination of hex, number as string", () => {
    const hasher = new KeccakHasher();

    const hash = hasher.hash(["0x1", "1", "0x2", "2", "0x3", "3", "0x4", "4"]);

    expect(hash).toEqual("0xf6770da1453b562908e206793d4b1f99237e8177d7a4403dfdb8012972912b61");
  });
});
