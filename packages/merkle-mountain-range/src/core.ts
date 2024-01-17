import {
  AppendResult,
  PeaksFormattingOptions,
  Proof,
  formatPeaks,
  formatProof,
  ProofOptions,
  PeaksOptions,
} from "./types";
import {
  arrayDeduplicate,
  bitLength,
  elementIndexToLeafIndex,
  findPeaks,
  findSiblings,
  getPeakInfo,
  leafCountToAppendNoMerges,
} from "./helpers";
import { TreesDatabase } from "./trees-database";
import { IHasher, IStore } from "@accumulators/core";

export default class CoreMMR extends TreesDatabase {
  constructor(store: IStore, public readonly hasher: IHasher, mmrId?: string) {
    super(store, mmrId);
  }

  // creates new MMR with a single element which is hash of "brave new world" string
  static async createWithGenesis(store: IStore, hasher: IHasher, mmrId?: string) {
    const mmr = new CoreMMR(store, hasher, mmrId);
    if ((await mmr.elementsCount.get()) != 0) {
      throw new Error(
        "Cannot call createWithGenesis on a non-empty MMR. Please provide an empty store or change the MMR id."
      );
    }
    await mmr.append(hasher.getGenesis());
    return mmr;
  }

  async append(value: string): Promise<AppendResult> {
    if (!this.hasher.isElementSizeValid(value)) throw new Error("Element size is too big to hash with this hasher");

    const elementsCount = await this.elementsCount.get();
    const peaks = await this.retrievePeaksHashes(findPeaks(elementsCount));

    let lastElementIdx = await this.elementsCount.increment();
    const leafElementIndex = lastElementIdx;

    //? Store the hash in the database
    await this.hashes.set(value, lastElementIdx);

    peaks.push(value);

    const noMerges = leafCountToAppendNoMerges(await this.leavesCount.get());
    for (let i = 0; i < noMerges; i++) {
      lastElementIdx++;

      const rightHash = peaks.pop();
      const leftHash = peaks.pop();

      const parentHash = this.hasher.hash([leftHash, rightHash]);
      await this.hashes.set(parentHash, lastElementIdx);
      peaks.push(parentHash);
    }

    //? Update latest value.
    await this.elementsCount.set(lastElementIdx);

    const bag = await this.bagThePeaks();

    //? Compute the new root hash
    const rootHash = await this.calculateRootHash(bag, lastElementIdx);
    await this.rootHash.set(rootHash);

    //? Returns the new total number of leaves.
    const leaves = await this.leavesCount.increment();

    return {
      leavesCount: leaves,
      elementsCount: lastElementIdx,
      elementIndex: leafElementIndex,
      rootHash,
    };
  }

  /**
   *
   * Generates an inclusion proof of an element at a certain tree state
   *
   * @param elementIndex the index of the element to prove the inclusion of
   * @param [options] Options containing the optional tree size at which the proof should be generated alongside formatting specifiers
   * @returns the generated inclusion proof.
   */
  async getProof(elementIndex: number, options: ProofOptions = {}): Promise<Proof> {
    if (elementIndex <= 0) throw new Error("Index must be greater than 0");

    const { elementsCount, formattingOpts } = options;
    const treeSize = elementsCount ?? (await this.elementsCount.get());
    if (elementIndex > treeSize) throw new Error("Index must be less or equal to the tree tree size");

    const peaks = findPeaks(treeSize);
    const siblings = findSiblings(elementIndex, treeSize);

    const peaksHashes = await this.retrievePeaksHashes(peaks, formattingOpts?.peaks);
    let siblingsHashes = [...(await this.hashes.getMany(siblings)).values()];

    if (options.formattingOpts) {
      const { proof: proofFormattingOpts } = options.formattingOpts;
      siblingsHashes = formatProof(siblingsHashes, proofFormattingOpts);
    }

    return {
      elementIndex,
      elementHash: await this.hashes.get(elementIndex),
      siblingsHashes,
      peaksHashes,
      elementsCount: treeSize,
    };
  }

  /**
   *
   * Generates an inclusion proof of an element at a certain tree state
   *
   * @param elementsIds the indexes of the elements to prove the inclusion of
   * @param [options] Options containing the optional tree size at which the proof should be generated alongside formatting specifiers
   * @returns the generated inclusion proofs.
   */
  async getProofs(elementsIds: number[], options: ProofOptions = {}): Promise<Proof[]> {
    const { elementsCount, formattingOpts } = options;
    const treeSize = elementsCount ?? (await this.elementsCount.get());

    elementsIds.forEach((elementIndex) => {
      if (elementIndex < 1) throw new Error("Index must be greater than 1");
      if (elementIndex > treeSize) throw new Error("Index must be less than the tree tree size");
    });
    const peaks = findPeaks(treeSize);
    const siblingsPerElement = new Map<number, number[]>();

    for (const elementIndex of elementsIds) {
      siblingsPerElement.set(elementIndex, findSiblings(elementIndex, treeSize));
    }

    const peaksHashes = await this.retrievePeaksHashes(peaks, formattingOpts?.peaks);
    const siblingsHashesToGet = arrayDeduplicate(Array.from(siblingsPerElement.values()).flat());
    const allSiblingsHashes = await this.hashes.getMany(siblingsHashesToGet);
    const elementHashes = await this.hashes.getMany(elementsIds);

    const proofs: Proof[] = [];
    for (const elementIndex of elementsIds) {
      const siblings = siblingsPerElement.get(elementIndex);
      let siblingsHashes: string[] = [];
      for (const sibling of siblings) {
        siblingsHashes.push(allSiblingsHashes.get(sibling.toString()));
      }

      if (options.formattingOpts) {
        const { proof: proofFormattingOpts } = options.formattingOpts;
        siblingsHashes = formatProof(siblingsHashes, proofFormattingOpts);
      }

      proofs.push({
        elementIndex,
        elementHash: elementHashes.get(elementIndex.toString()),
        siblingsHashes,
        peaksHashes,
        elementsCount: treeSize,
      });
    }
    return proofs;
  }

  /**
   * Verifies a proof
   *
   * @param proof the proof to verify
   * @param elementValue the actual value appended to the tree, a preimage of the element hash
   * @param [options] Options containing the optional tree size at which the proof should be generated alongside formatting specifiers
   * @returns boolean
   */
  async verifyProof(proof: Proof, elementValue: string, options: ProofOptions = {}): Promise<boolean> {
    const { elementsCount, formattingOpts } = options;
    const treeSize = elementsCount ?? (await this.elementsCount.get());

    // Check if proof is formatted
    if (formattingOpts) {
      const { proof: proofFormat, peaks: peaksFormat } = formattingOpts;

      const proofNullValuesCount = proof.siblingsHashes.filter((s) => s === proofFormat.nullValue).length;
      proof.siblingsHashes = proof.siblingsHashes.slice(0, proof.siblingsHashes.length - proofNullValuesCount);

      const peaksNullValuesCount = proof.peaksHashes.filter((s) => s === peaksFormat.nullValue).length;
      proof.peaksHashes = proof.peaksHashes.slice(0, proof.peaksHashes.length - peaksNullValuesCount);
    }

    let { elementIndex, siblingsHashes } = proof;
    if (elementIndex <= 0) throw new Error("Index must be greater than 0");
    if (elementIndex > treeSize) throw new Error("Index must be in the tree");

    const [peakIndex, peakHeight] = getPeakInfo(treeSize, elementIndex);
    if (proof.siblingsHashes.length !== peakHeight) return false;

    let hash = elementValue;
    let leafIndex = elementIndexToLeafIndex(elementIndex);
    for (const proofHash of siblingsHashes) {
      const isRight = leafIndex % 2 === 1;
      leafIndex = Math.floor(leafIndex / 2);

      hash = this.hasher.hash(isRight ? [proofHash, hash] : [hash, proofHash]);
    }

    const peakHashes = await this.retrievePeaksHashes(findPeaks(treeSize));

    return peakHashes[peakIndex] === hash;
  }

  async getPeaks(options: PeaksOptions = {}): Promise<string[]> {
    const { elementsCount, formattingOpts } = options;
    const treeSize = elementsCount ?? (await this.elementsCount.get());
    const peaksIdxs = findPeaks(treeSize);
    const peaks = await this.retrievePeaksHashes(peaksIdxs);
    if (formattingOpts) {
      return formatPeaks(peaks, formattingOpts);
    }
    return peaks;
  }

  async bagThePeaks(elementsCount?: number): Promise<string> {
    const treeSize = elementsCount ?? (await this.elementsCount.get());
    const peaksIdxs = findPeaks(treeSize);
    const peaksHashes = await this.retrievePeaksHashes(peaksIdxs);

    if (peaksIdxs.length === 0) return "0x0";
    else if (peaksIdxs.length === 1) {
      return peaksHashes[0];
    }

    const root0 = this.hasher.hash([peaksHashes[peaksHashes.length - 2], peaksHashes[peaksHashes.length - 1]]);
    const root = peaksHashes
      .slice(0, peaksHashes.length - 2)
      .reverse()
      .reduce((prev, cur) => this.hasher.hash([cur, prev]), root0);

    return root;
  }

  async calculateRootHash(bag: string, leafCount: number) {
    return this.hasher.hash([leafCount.toString(), bag]);
  }

  private static countOnes(value: number): number {
    let n = value;
    let onesCount = 0;
    while (n > 0) {
      n = n & (n - 1);
      onesCount++;
    }
    return onesCount;
  }

  static mapLeafIndexToElementIndex(leafIndex: number): number {
    return 2 * leafIndex + 1 - this.countOnes(leafIndex);
  }

  static mapElementIndexToLeafIndex(elementIndex: number): number {
    elementIndex--;
    let outputIndex = 0;
    for (let i = bitLength(elementIndex) - 1; i >= 0; i--) {
      const subTreeSize = (2 << i) - 1; // 2^(i+1) - 1
      if (subTreeSize <= elementIndex) {
        elementIndex -= subTreeSize;
        outputIndex += 1 << i; // 2^i
      }
    }
    if (elementIndex != 0) {
      throw new Error("Provided index is not a leaf");
    }
    return outputIndex;
  }

  async retrievePeaksHashes(peaksIdxs: number[], formattingOpts?: PeaksFormattingOptions): Promise<string[]> {
    const hashes = await this.hashes.getMany(peaksIdxs);
    if (formattingOpts) {
      return formatPeaks([...hashes.values()], formattingOpts);
    }
    return [...hashes.values()];
  }

  async clear() {
    const toDelete = [this.elementsCount.key, this.rootHash.key, this.leavesCount.key];
    const elementsCount = await this.elementsCount.get();

    return this.store.deleteMany(
      toDelete.concat(new Array(elementsCount).fill(0).map((_, i) => this.hashes.getFullKey(i + 1)))
    );
  }
}
