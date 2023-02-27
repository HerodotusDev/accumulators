/* tslint:disable */
/* eslint-disable */
/**
* Computes the Starkware version of the Pedersen hash of x and y. All inputs are little-endian.
* Returns its 0x-prefixed lowercase hex representation. Output is big-endian.
* @param {string} x
* @param {string} y
* @returns {string}
*/
export function pedersen(x: string, y: string): string;
/**
* Computes the Starkware version of the Pedersen hash of x and y. All inputs are little-endian.
* Returns its 0x-prefixed lowercase hex representation. Output is big-endian.
* https://github.com/xJonathanLEI/starknet-rs/blob/89a724f00ba6000120b17f68f6da0b4c982eea2f/starknet-crypto/src/pedersen_hash.rs#L19
* @param {Uint8Array} x
* @param {Uint8Array} y
* @returns {string}
*/
export function starknet_pedersen(x: Uint8Array, y: Uint8Array): string;
/**
* Computes the Starkware version of the Pedersen hash of x and y. All inputs are big-endian.
* Returns its Cairo representation.
* https://github.com/xJonathanLEI/starknet-rs/blob/89a724f00ba6000120b17f68f6da0b4c982eea2f/starknet-crypto/src/pedersen_hash.rs#L19
* @param {Uint8Array} x
* @param {Uint8Array} y
* @returns {string}
*/
export function starknet_pedersen_cairo(x: Uint8Array, y: Uint8Array): string;
/**
*/
export enum Error {
  EmptyDataError,
  OverflowError,
  IncorrectLenError,
  IOError,
  TypeError,
  UnsignableMessage,
}
