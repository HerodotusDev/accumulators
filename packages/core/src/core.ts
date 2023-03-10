import { AppendResult, IHasher, IStore, Proof } from "./types";
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

    const leaves = await this.leavesCount.increment();
    //? Returns the new total number of leaves.
    return {
      leavesCount: leaves,
      leafIndex,
      rootHash,
      lastPos: lastElementIdx, //? Tree size
    };
  }

  async getProof(leafIndex: number): Promise<Proof> {
    if (leafIndex < 1) throw new Error("Index must be greater than 1");
    if (leafIndex > (await this.elementsCount.get())) throw new Error("Index must be less than the tree size");

    const peaks = findPeaks(await this.elementsCount.get());
    const siblings = [];

    let index = leafIndex;
    while (!peaks.includes(index)) {
      // If not peak, must have parent
      const isRight = getHeight(index + 1) == getHeight(index) + 1;
      const sib = isRight ? index - siblingOffset(getHeight(index)) : index + siblingOffset(getHeight(index));
      siblings.push(sib);

      index = isRight ? index + 1 : index + parentOffset(getHeight(index));
    }

    return {
      leafIndex: leafIndex,
      leafHash: await this.hashes.get(leafIndex),
      siblingsHashes: [...(await this.hashes.getMany(siblings)).values()],
      peaksHashes: await this.retrievePeaksHashes(peaks),
      leavesCount: await this.leavesCount.get(),
    };
  }

  /**
   * Verifies a proof
   *
   * @param proof the proof to verify
   * @param leafValue the actual value appended to the tree, a preimage of the leaf hash
   * @returns boolean
   */
  async verifyProof(proof: Proof, leafValue: string): Promise<boolean> {
    let { leafIndex, siblingsHashes } = proof;
    if (leafIndex < 1) throw new Error("Index must be greater than 1");
    if (leafIndex > (await this.elementsCount.get())) throw new Error("Index must be in the tree");

    let hash = this.hasher.hash([leafIndex.toString(), leafValue]);

    for (const proofHash of siblingsHashes) {
      const isRight = getHeight(leafIndex + 1) == getHeight(leafIndex) + 1;
      leafIndex = isRight ? leafIndex + 1 : leafIndex + parentOffset(getHeight(leafIndex));
      hash = this.hasher.hash([
        leafIndex.toString(),
        isRight ? this.hasher.hash([proofHash, hash]) : this.hasher.hash([hash, proofHash]),
      ]);
    }

    return (await this.retrievePeaksHashes(findPeaks(await this.elementsCount.get()))).includes(hash);
  }

  async getPeaks(): Promise<string[]> {
    const lastElementId = await this.elementsCount.get();
    const peaksIdxs = findPeaks(lastElementId);
    return this.retrievePeaksHashes(peaksIdxs);
  }

  async bagThePeaks(): Promise<string> {
    const lastElementId = await this.elementsCount.get();
    const peaksIdxs = findPeaks(lastElementId);
    const peaksHashes = await this.retrievePeaksHashes(peaksIdxs);

    if (peaksIdxs.length === 1) {
      return this.hasher.hash([lastElementId.toString(), peaksHashes[0]]);
    }

    const root0 = this.hasher.hash([peaksHashes[peaksHashes.length - 2], peaksHashes[peaksHashes.length - 1]]);

    const root = peaksHashes
      .slice(0, peaksHashes.length - 2)
      .reverse()
      .reduce((prev, cur) => this.hasher.hash([cur, prev]), root0);
    return this.hasher.hash([lastElementId.toString(), root]);
  }

  async retrievePeaksHashes(peaksIdxs: number[]): Promise<string[]> {
    const hashes = await this.hashes.getMany(peaksIdxs);
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
