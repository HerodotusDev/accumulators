import { AppendResult, IHasher, IStore } from "./types";
import { findPeaks, getHeight, parentOffset, siblingOffset } from "./helpers";
import { TreesDatabase } from "./trees-database";

export class CoreMMR extends TreesDatabase {
  constructor(store: IStore, protected readonly hasher: IHasher, mmrUuid?: string) {
    super(store, mmrUuid);
  }

  async append(value: string): Promise<AppendResult> {
    if (!this.hasher.isElementSizeValid(value)) throw new Error("Element size is invalid");

    const peaks = await this.retrievePeaksHashes(findPeaks(await this.elementsCount.get()));

    let lastElementIdx = await this.elementsCount.increment();
    const leafIdx = lastElementIdx;

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
      leafIdx: leafIdx.toString(),
      rootHash,
      lastPos: lastElementIdx, //? Tree size
    };
  }

  async getProof(index: number): Promise<string[]> {
    if (index < 1) throw new Error("Index must be greater than 1");
    if (index > (await this.elementsCount.get())) throw new Error("Index must be less than the tree size");

    const proof = [];
    const peaks = findPeaks(await this.elementsCount.get());

    while (!peaks.includes(index)) {
      // If not peak, must have parent
      const isRight = getHeight(index + 1) == getHeight(index) + 1;
      const sib = isRight ? index - siblingOffset(getHeight(index)) : index + siblingOffset(getHeight(index));
      proof.push(await this.hashes.get(sib));

      index = isRight ? index + 1 : index + parentOffset(getHeight(index));
    }

    return proof;
  }

  async verifyProof(index: number, value: string, proof: string[]) {
    if (index < 1) throw new Error("Index must be greater than 1");
    if (index > (await this.elementsCount.get())) throw new Error("Index must be less than the tree size");

    let hash = this.hasher.hash([index.toString(), value]);

    for (const proofHash of proof) {
      const isRight = getHeight(index + 1) == getHeight(index) + 1;
      index = isRight ? index + 1 : index + parentOffset(getHeight(index));
      hash = this.hasher.hash([
        index.toString(),
        isRight ? this.hasher.hash([proofHash, hash]) : this.hasher.hash([hash, proofHash]),
      ]);
    }

    return (await this.retrievePeaksHashes(findPeaks(await this.elementsCount.get()))).includes(hash);
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

  async retrievePeaksHashes(peaksIdxs?: number[]): Promise<string[]> {
    const peakHashes: string[] = [];
    const hashes = await this.hashes.getMany(peaksIdxs);

    for (const peakId of peaksIdxs) {
      const hash = hashes.get(peakId.toString());
      if (hash) peakHashes.push(hash);
    }
    return peakHashes;
  }
}

export { IHasher, IStore } from "./types";
