import { IHasher } from "@herodotus_dev/mmr-core";
const buildPoseidon = require("circomlibjs").buildPoseidon;

export class PoseidonHasher extends IHasher {
  poseidon: any;

  private constructor() {
    super({ blockSizeBits: 254 });
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
    return '0x' + this.poseidon.F.toString(this.poseidon(data));
  }
}
