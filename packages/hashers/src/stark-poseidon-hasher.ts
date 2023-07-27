import { IHasher } from "@accumulators/core";
import { poseidonHashMany } from "micro-starknet";

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
    return "0x" + poseidonHashMany(data.map((data_piece) => BigInt(data_piece))).toString(16);
  }
}
