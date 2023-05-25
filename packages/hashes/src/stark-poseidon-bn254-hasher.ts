import { IHasher } from "@herodotus_dev/mmr-core";
import { poseidonBasic } from "micro-starknet";
import { Field } from "@noble/curves/abstract/modular";

const MDS_SMALL = [
  [3, 1, 1],
  [1, -1, 1],
  [1, 1, -2],
].map((i) => i.map(BigInt));

export const P = Field(
  BigInt('0x30644e72e131a029b85045b68181585d2833e84879b9709143e1f593f0000001')
);

const poseidonSmall = poseidonBasic(
  { Fp: P, rate: 2, capacity: 1, roundsFull: 8, roundsPartial: 83 },
  MDS_SMALL
);

export class StarkPoseidonBN254Hasher extends IHasher {
  constructor() {
    super({ blockSizeBits: 254 });
  }

  hash(data: string[]): string {
    if (data.length !== 2) throw new Error("Stark Poseidon BN254 Hasher only accepts two elements");

    const sizeErrorIndex = data.findIndex((e) => this.isElementSizeValid(e) === false);
    if (sizeErrorIndex > -1)
      throw new Error(
        `Stark Poseidon BN254 Hasher only accepts elements of size ${this.options.blockSizeBits} bits. Got ${JSON.stringify(
          IHasher.byteSize(data[sizeErrorIndex])
        )}`
      );
    return "0x" + poseidonSmall([BigInt(data[0]), BigInt(data[1]), 2n])[0].toString(16);
  }
}
