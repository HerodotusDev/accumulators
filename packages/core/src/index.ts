import { AppendResult, IHasher, IStore } from "./types";
import { findPeaks, getHeight, parentOffset, siblingOffset } from "./helpers";
import { TreesDatabase } from "./trees-database";

export class CoreMMR extends TreesDatabase {
  constructor(store: IStore, private readonly hasher: IHasher, mmrUuid?: string) {
    super(store, mmrUuid);
  }

  async append(value: string): Promise<AppendResult> {
    if (!this.hasher.isElementSizeValid(value)) throw new Error("Element size is invalid");

    let lastElementIdx = await this.elementsCount.increment();
    const leafIdx = lastElementIdx;

    //? hash that will be stored in the database
    const hash = this.hasher.hash([lastElementIdx.toString(), value]);

    //? Store the hash in the database
    await this.hashes.set(hash, lastElementIdx);

    let height = 0;
    while (getHeight(lastElementIdx + 1) > height) {
      lastElementIdx++;

      const left = lastElementIdx - parentOffset(height);
      const right = left + siblingOffset(height);

      const hashes = await this.hashes.getMany([left, right]);
      const leftHash = hashes.get(left.toString());
      const rightHash = hashes.get(right.toString());

      const parentHash = this.hasher.hash([lastElementIdx.toString(), this.hasher.hash([leftHash, rightHash])]);
      await this.hashes.set(parentHash, lastElementIdx);
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

  async bagThePeaks(): Promise<string> {
    const lastElementId = await this.elementsCount.increment();
    const peaksIdxs = findPeaks(lastElementId);
    const peaksHashes = await this.retrievePeaksHashes(peaksIdxs);

    console.log(`lastElementId: ${lastElementId}`);
    console.log(`peaksIdxs: ${peaksIdxs}`);
    console.log(`peaksHashes: ${peaksHashes}`);

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
