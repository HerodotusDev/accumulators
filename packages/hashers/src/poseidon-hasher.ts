import { IHasher } from "@accumulators/core";
const buildPoseidon = require("circomlibjs").buildPoseidon;

export class PoseidonHasher extends IHasher {
  poseidon: any;

  private constructor(shouldPad?: boolean) {
    super({ blockSizeBits: 254, shouldPad });
  }

  public static async create(): Promise<PoseidonHasher> {
    const hasher = new PoseidonHasher();
    hasher.poseidon = await buildPoseidon();
    return hasher;
  }

  hash(data: string[]): string {
    const sizeErrorIndex = data.findIndex((e) => this.isElementSizeValid(e) === false);
    if (sizeErrorIndex > -1)
      throw new Error(
        `Poseidon Hasher only accepts elements of size ${this.options.blockSizeBits} bits. Got ${JSON.stringify(
          IHasher.byteSize(data[sizeErrorIndex])
        )}`
      );
    let hash = BigInt(this.poseidon.F.toString(this.poseidon(data))).toString(16);

    if (this.options.shouldPad) hash = hash.padStart(64, "0");
    return `0x${hash}`;
  }
}
