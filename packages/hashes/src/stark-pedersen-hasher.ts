import { IHasher } from "@mmr/core";
import { pedersen } from "./pedersen/pedersen_wasm";

export class StarkPedersenHasher extends IHasher {
  constructor() {
    super({ blockSizeBits: 252 });
  }

  hash(data: string[]): string {
    if (data.length !== 2) throw new Error("Stark Pedersen Hasher only accepts two elements");
    if (data.some((e) => e === undefined)) {
      throw new Error(`Stark Pedersen Hasher does not accept undefined elements. Got ${JSON.stringify(data)}`);
    }
    return pedersen(data[0], data[1]);
  }
}
