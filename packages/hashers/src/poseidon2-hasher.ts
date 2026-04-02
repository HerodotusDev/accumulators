import { IHasher } from "@accumulators/core";
import { poseidon2Hash } from "@zkpassport/poseidon2";

export class Poseidon2Hasher extends IHasher {
  constructor(shouldPad?: boolean) {
    super({ blockSizeBits: 254, shouldPad });
  }

  hash(data: string[]): string {
    const sizeErrorIndex = data.findIndex((e) => this.isElementSizeValid(e) === false);
    if (sizeErrorIndex > -1)
      throw new Error(
        `Poseidon2 Hasher only accepts elements of size ${this.options.blockSizeBits} bits. Got ${JSON.stringify(
          IHasher.byteSize(data[sizeErrorIndex])
        )}`
      );

    let hash = poseidon2Hash(data.map((e) => BigInt(e))).toString(16);
    if (this.options.shouldPad) hash = hash.padStart(64, "0");
    return `0x${hash}`;
  }
}
