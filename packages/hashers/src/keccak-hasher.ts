import { keccak256 } from "ethers";
import { IHasher } from "@accumulators/core";

export class KeccakHasher extends IHasher {
  arrayToUint8Array = (data: string[]) =>
    new Uint8Array(
      data
        .map((e) => BigInt(e))
        .flatMap((n) => {
          const hex = n.toString(16).padStart(64, "0");
          return hex.match(/.{2}/g)!.map((byte) => parseInt(byte, 16));
        })
    );

  hash(data: string[]): string {
    // If the data is empty, return the hash of an empty array
    if (data.length === 0) return keccak256(new Uint8Array([]));
    // If the data has a single element, return the hash of that element using `ethers.js` keccak256
    if (data.length === 1) {
      return keccak256(data[0]);
    }

    const bytes = this.arrayToUint8Array(data);
    return keccak256(bytes);
  }
}
