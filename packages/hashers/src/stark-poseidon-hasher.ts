import { IHasher } from "@accumulators/core";
import { poseidonHash, poseidonHashMany, poseidonHashSingle } from "micro-starknet";

export class StarkPoseidonHasher extends IHasher {
  constructor(shouldPad?: boolean) {
    super({ blockSizeBits: 252, shouldPad });
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

    let hashCore: bigint;
    if (data.length === 1) {
      hashCore = poseidonHashSingle(bigintData[0]);
    } else if (data.length === 2) {
      hashCore = poseidonHash(bigintData[0], bigintData[1]);
    } else if (data.length > 2) {
      hashCore = poseidonHashMany(bigintData);
    } else throw new Error("Stark Poseidon Hasher only accepts arrays of size 1 or greater");

    let hash = hashCore.toString(16);
    if (this.options.shouldPad) hash = hash.padStart(63, "0");
    return `0x${hash}`;
  }
}
