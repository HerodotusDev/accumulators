import { IHasher } from "@herodotus_dev/mmr-core";
import { keccak256 } from "@ethersproject/solidity";

export class KeccakHasher extends IHasher {
  hash(data: string[]): string {
    return keccak256(
      data.map((_) => "bytes32"),
      data
    );
  }
}
