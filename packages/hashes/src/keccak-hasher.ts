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
    // If the data is empty, return the hash of an empty array
    if (data.length === 0) return utils.keccak256([]);
    // If the data has a single element, return the hash of that element using `ethers.js` keccak256
    if (data.length === 1) {
      return utils.keccak256(data[0]);
    }

    // Process the data in chunks of 32 bytes elements
    // Pad elements to 32 bytes
    data = data.map((e) => this.numberStringToBytes32(e));
    return keccak256(
      data.map((_) => "bytes32"),
      data
    );
  }
}
