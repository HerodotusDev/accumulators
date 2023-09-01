import { PeaksFormattingOptions, ProofFormattingOptions } from "./formatting";

export interface Proof {
  /**
   * The index of the proven element
   *
   * @example 1
   */
  elementIndex: number;
  /**
   * The hash of the element - the hash that is stored in the database
   *
   * @example "0x1234567890abcdef"
   */
  elementHash: string;
  /**
   * The proof of the element's inclusion, aka the siblings hashes
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

export type ProofOptions = {
  elementsCount?: number;
  formattingOpts?: {
    proof: ProofFormattingOptions;
    peaks: PeaksFormattingOptions;
  };
};

export type PeaksOptions = {
  elementsCount?: number;
  formattingOpts?: PeaksFormattingOptions;
};
