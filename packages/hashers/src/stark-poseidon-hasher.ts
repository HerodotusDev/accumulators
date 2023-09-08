import { IHasher } from "@accumulators/core";
import { poseidonHash, poseidonHashMany, poseidonHashSingle } from "micro-starknet";

export class StarkPoseidonHasher extends IHasher {
  constructor() {
    super({ blockSizeBits: 252 });
  }

  hash(data: string[]): string {
    const sizeErrorIndex = data.findIndex((e) => this.isElementSizeValid(e) === false);
    if (sizeErrorIndex > -1)
      throw new Error(
        `Stark Poseidon Hasher only accepts elements of size ${this.options.blockSizeBits} bits. Got ${JSON.stringify(
          IHasher.byteSize(data[sizeErrorIndex])
        )}`
      );
    const bigintData = data.map((e) => BigInt(e));

    if (data.length === 1) {
      return "0x" + poseidonHashSingle(bigintData[0]).toString(16).padStart(63, "0");
    } else if (data.length === 2) {
      return "0x" + poseidonHash(bigintData[0], bigintData[1]).toString(16).padStart(63, "0");
    } else if (data.length > 2) {
      return "0x" + poseidonHashMany(bigintData).toString(16).padStart(63, "0");
    } else throw new Error("Stark Poseidon Hasher only accepts arrays of size 1 or greater");
  }
}
