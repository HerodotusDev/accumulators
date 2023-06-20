import { IHasher } from "@accumulators/core";
import { pedersen } from "./pedersen/pedersen_wasm";

export class StarkPedersenHasher extends IHasher {
  constructor() {
    super({ blockSizeBits: 252 });
  }

  hash(data: string[]): string {
    if (data.length !== 2) throw new Error("Stark Pedersen Hasher only accepts two elements");
    if (data.some((e) => typeof e !== "string"))
      throw new Error(
        `Stark Pedersen Hasher does not accept elements that are not string. Got ${JSON.stringify(data)}`
      );
    const sizeErrorIndex = data.findIndex((e) => this.isElementSizeValid(e) === false);
    if (sizeErrorIndex > -1)
      throw new Error(
        `Stark Pedersen Hasher only accepts elements of size ${this.options.blockSizeBits} bits. Got ${JSON.stringify(
          IHasher.byteSize(data[sizeErrorIndex])
        )}`
      );
    return pedersen(data[0], data[1]);
  }
}
