import { IHasher } from "@herodotus_dev/mmr-core";
import { keccak256 } from "@ethersproject/solidity";
import { BigNumber, utils } from "ethers";

export class KeccakHasher extends IHasher {
  numberStringToBytes32(numberAsString: string): string {
    // Convert the number string to a BigNumber
    const numberAsBigNumber = BigNumber.from(numberAsString);

    // Convert the BigNumber to a zero-padded hex string
    const hexString = utils.hexZeroPad(numberAsBigNumber.toHexString(), 32);

    return hexString;
  }

  hash(data: string[]): string {
    // Pad elements to 32 bytes
    data = data.map((e) => this.numberStringToBytes32(e));

    return keccak256(
      data.map((_) => "bytes32"),
      data
    );
  }
}
