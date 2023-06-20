import { IHasher } from "@accumulators/core";
import { poseidonHash } from "micro-starknet";

export class StarkPoseidonHasher extends IHasher {
  constructor() {
    super({ blockSizeBits: 252 });
  }

  hash(data: string[]): string {
    if (data.length !== 2) throw new Error("Stark Poseidon Hasher only accepts two elements");

    const sizeErrorIndex = data.findIndex((e) => this.isElementSizeValid(e) === false);
    if (sizeErrorIndex > -1)
      throw new Error(
        `Stark Poseidon Hasher only accepts elements of size ${this.options.blockSizeBits} bits. Got ${JSON.stringify(
          IHasher.byteSize(data[sizeErrorIndex])
        )}`
      );
    return "0x" + poseidonHash(BigInt(data[0]), BigInt(data[1])).toString(16);
  }
}
