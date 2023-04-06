import { IHasher } from "@herodotus_dev/mmr-core";
import { keccak256 } from "@ethersproject/solidity";

export class KeccakHasher extends IHasher {
  hash(data: string[]): string {
    // Pad elements to 32 bytes
    data = data.map((e) => {
      if (e.startsWith("0x")) e = e.slice(2);
      e = e.padStart(64, "0");
      return "0x" + e;
    });
    return keccak256(
      data.map((_) => "bytes32"),
      data
    );
  }
}
