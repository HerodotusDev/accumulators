import {
  AppendResult,
  PeaksFormattingOptions,
  ProofFormattingOptions,
  IHasher,
  IStore,
  Proof,
  formatPeaks,
  formatProof,
  ProofOptions,
  PeaksOptions,
} from "./types";
import { findPeaks, getHeight, parentOffset, siblingOffset } from "./helpers";
import { TreesDatabase } from "./trees-database";

export default class CoreMMR extends TreesDatabase {
  constructor(store: IStore, protected readonly hasher: IHasher, mmrUuid?: string) {
    super(store, mmrUuid);
  }

  async append(value: string): Promise<AppendResult> {
    if (!this.hasher.isElementSizeValid(value)) throw new Error("Element size is too big to hash with this hasher");

    const elementsCount = await this.elementsCount.get();
    const peaks = await this.retrievePeaksHashes(findPeaks(elementsCount));

    let lastElementIdx = await this.elementsCount.increment();
    const leafIndex = lastElementIdx;

    //? hash that will be stored in the database
    const hash = this.hasher.hash([lastElementIdx.toString(), value]);

    //? Store the hash in the database
    await this.hashes.set(hash, lastElementIdx);

    peaks.push(hash);

    let height = 0;
    while (getHeight(lastElementIdx + 1) > height) {
      lastElementIdx++;

      const rightHash = peaks.pop();
      const leftHash = peaks.pop();

      const parentHash = this.hasher.hash([lastElementIdx.toString(), this.hasher.hash([leftHash, rightHash])]);
      await this.hashes.set(parentHash, lastElementIdx);
      peaks.push(parentHash);

      height++;
    }

    //? Update latest value.
    await this.elementsCount.set(lastElementIdx);

    //? Compute the new root hash
    const rootHash = await this.bagThePeaks();
    await this.rootHash.set(rootHash);

    //? Returns the new total number of leaves.
    const leaves = await this.leavesCount.increment();

    return {
      leavesCount: leaves,
      elementsCount: lastElementIdx,
      leafIndex,
      rootHash,
    };
  }

  /**
   *
   * Generates an inclusion proof of a leaf at a certain tree state
   *
   * @param leafIndex the leaf index of the element to prove the inclusion of
   * @param [options] Options containing the optional tree size at which the proof should be generated alongside formatting specifiers
   * @returns the generated inclusion proof.
   */
  async getProof(leafIndex: number, options: ProofOptions = {}): Promise<Proof> {
    if (leafIndex < 1) throw new Error("Index must be greater than 1");

    const { elementsCount, formattingOpts } = options;
    const treeSize = elementsCount ?? (await this.elementsCount.get());
    if (leafIndex > treeSize) throw new Error("Index must be less than the tree tree size");

    const peaks = findPeaks(treeSize);
    const siblings = [];

    let index = leafIndex;
    while (!peaks.includes(index)) {
      // If not peak, must have parent
      const isRight = getHeight(index + 1) == getHeight(index) + 1;
      const sib = isRight ? index - siblingOffset(getHeight(index)) : index + siblingOffset(getHeight(index));
      siblings.push(sib);

      index = isRight ? index + 1 : index + parentOffset(getHeight(index));
    }

    const peaksHashes = await this.retrievePeaksHashes(peaks, formattingOpts?.peaks);
    let siblingsHashes = [...(await this.hashes.getMany(siblings)).values()];

    if (options.formattingOpts) {
      const { proof: proofFormattingOpts } = options.formattingOpts;
      siblingsHashes = formatProof(siblingsHashes, proofFormattingOpts);
    }

    return {
      leafIndex: leafIndex,
      leafHash: await this.hashes.get(leafIndex),
      siblingsHashes,
      peaksHashes,
      elementsCount: treeSize,
    };
  }

  async getProofs(leavesIds: number[], options: ProofOptions = {}): Promise<Proof[]> {
    const { elementsCount, formattingOpts } = options;
    const treeSize = elementsCount ?? (await this.elementsCount.get());

    leavesIds.forEach(leafIndex => {
      if (leafIndex < 1) throw new Error("Index must be greater than 1");
      if (leafIndex > treeSize) throw new Error("Index must be less than the tree tree size");
    })
    const peaks = findPeaks(treeSize);
    const siblingsPerLeaf = new Map<number, number[]>();

    for (const leafIndex of leavesIds) {
      const siblings = [];
      let index = leafIndex;
      while (!peaks.includes(index)) {
        // If not peak, must have parent
        const isRight = getHeight(index + 1) == getHeight(index) + 1;
        const sib = isRight ? index - siblingOffset(getHeight(index)) : index + siblingOffset(getHeight(index));
        siblings.push(sib);
        index = isRight ? index + 1 : index + parentOffset(getHeight(index));
      }
      siblingsPerLeaf.set(leafIndex, siblings);
    }

    const peaksHashes = await this.retrievePeaksHashes(peaks, formattingOpts?.peaks);
    const allSiblingsHashes = await this.hashes.getMany(Array.from(siblingsPerLeaf.values()).flat());
    const leafHashes = await this.hashes.getMany(leavesIds);

    const proofs: Proof[] = [];
    for (const leafIndex of leavesIds) {
      const siblings = siblingsPerLeaf.get(leafIndex);
      let siblingsHashes: string[] = []
      for (const sibling of siblings) {
        siblingsHashes.push(allSiblingsHashes.get(sibling.toString()));
      }

      if (options.formattingOpts) {
        const { proof: proofFormattingOpts } = options.formattingOpts;
        siblingsHashes = formatProof(siblingsHashes, proofFormattingOpts);
      }

      proofs.push({
        leafIndex: leafIndex,
        leafHash: leafHashes.get(leafIndex.toString()),
        siblingsHashes,
        peaksHashes,
        elementsCount: treeSize,

      })
    }
    return proofs;
  }

  /**
   * Verifies a proof
   *
   * @param proof the proof to verify
   * @param leafValue the actual value appended to the tree, a preimage of the leaf hash
   * @param [options] Options containing the optional tree size at which the proof should be generated alongside formatting specifiers
   * @returns boolean
   */
  async verifyProof(proof: Proof, leafValue: string, options: ProofOptions = {}): Promise<boolean> {
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

    let { leafIndex, siblingsHashes } = proof;
    if (leafIndex < 1) throw new Error("Index must be greater than 1");
    if (leafIndex > treeSize) throw new Error("Index must be in the tree");

    let hash = this.hasher.hash([leafIndex.toString(), leafValue]);

    for (const proofHash of siblingsHashes) {
      const isRight = getHeight(leafIndex + 1) == getHeight(leafIndex) + 1;
      leafIndex = isRight ? leafIndex + 1 : leafIndex + parentOffset(getHeight(leafIndex));
      hash = this.hasher.hash([
        leafIndex.toString(),
        isRight ? this.hasher.hash([proofHash, hash]) : this.hasher.hash([hash, proofHash]),
      ]);
    }

    return (await this.retrievePeaksHashes(findPeaks(treeSize))).includes(hash);
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
      return this.hasher.hash([treeSize.toString(), peaksHashes[0]]);
    }

    const root0 = this.hasher.hash([peaksHashes[peaksHashes.length - 2], peaksHashes[peaksHashes.length - 1]]);
    const root = peaksHashes
      .slice(0, peaksHashes.length - 2)
      .reverse()
      .reduce((prev, cur) => this.hasher.hash([cur, prev]), root0);

    return this.hasher.hash([treeSize.toString(), root]);
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
