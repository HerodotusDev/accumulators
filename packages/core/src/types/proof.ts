export interface Proof {
  /**
   * The index of the leaf
   *
   * @example 1
   */
  leafIndex: number;
  /**
   * The hash of the leaf - the hash that is stored in the database
   *
   * @example "0x1234567890abcdef"
   */
  leafHash: string;
  /**
   * The proof of the leaf's inclusion, aka the siblings hashes
   *
   * @example ["0x1234567890abcdef", "0x1234567890abcdef"]
   */
  siblingsHashes: string[];
  /**
   * The hashes of the peaks of the tree
   *
   * @example ["0x1234567890abcdef", "0x1234567890abcdef"]
   */
  peaksHashes: string[];
  /**
   * The size of the tree, aka the position, aka the number of all elements in the tree
   *
   * @example 1
   */
  elementsCount: number;
}
