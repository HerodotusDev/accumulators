import { AppendResult, IHasher, IStore } from "./types";
import { v4 as uuid } from "uuid";
import { findPeaks, getHeight, parentOffset, siblingOffset } from "./helpers";
import { TreesDatabase } from "./trees-database";

export class CoreMMR extends TreesDatabase {
  private mmrUuid: string;

  constructor(store: IStore, private readonly hasher: IHasher, mmrUuid?: string) {
    super(store);
    mmrUuid ? (this.mmrUuid = mmrUuid) : (this.mmrUuid = uuid());
  }

  async append(value: string): Promise<AppendResult> {
    if (!this.hasher.isElementSizeValid(value)) throw new Error("Element size is invalid");

    let lastElementId = await this.incrementElementsCount();
    const leafIdx = lastElementId;

    //? hash that will be stored in the database
    const hash = this.hasher.hash([lastElementId.toString(), value]);

    //? Store the hash in the database
    await this.store.set(`${this.mmrUuid}:hashes:${lastElementId}`, hash);

    let height = 0;
    while (getHeight(lastElementId + 1) > height) {
      lastElementId++;
      const right = await this.store.get(`${this.mmrUuid}:hashes:${lastElementId}`);
      const left = await this.store.get(`${this.mmrUuid}:hashes:${lastElementId - 1}`);
      const parentHash = this.hasher.hash([lastElementId.toString(), this.hasher.hash([left, right])]);
      await this.store.set(`${this.mmrUuid}:hashes:${lastElementId}`, parentHash);
      height++;
    }

    // Update latest value.
    await this.setElementsCount(lastElementId);

    // Compute the new root hash
    const rootHash = await this.bagThePeaks();
    await this.setRootHash(rootHash);

    const leaves = await this.incrementLeavesCount();
    // Returns the new total number of leaves.
    return {
      leavesCount: leaves,
      leafIdx: leafIdx.toString(),
      rootHash,
      lastPos: lastElementId, // Tree size
    };
  }

  async bagThePeaks(): Promise<string> {
    const lastElementId = await this.getElementsCount();
    const peaks = findPeaks(lastElementId);
    const peaksHashes = await this.retrievePeaksHashes(lastElementId);

    if (peaks.length === 1) {
      return this.hasher.hash([lastElementId.toString(), peaksHashes[0]]);
    }

    const root0 = this.hasher.hash([peaksHashes[peaksHashes.length - 2], peaksHashes[peaksHashes.length - 1]]);

    const root = peaksHashes
      .slice(0, peaksHashes.length - 2)
      .reverse()
      .reduce((prev, cur) => this.hasher.hash([cur, prev]), root0);
    return this.hasher.hash([lastElementId.toString(), root]);
  }

  async retrievePeaksHashes(givenLastPos?: number): Promise<string[]> {
    // Check if given position is valid
    if (givenLastPos) {
      const currentLastPos = await this.getElementsCount();
      if (givenLastPos > currentLastPos) throw new Error("Given position cannot exceed last position");
      givenLastPos = currentLastPos;
    }

    const peaksIndexes = findPeaks(givenLastPos);
    const peaksHashesPromises = peaksIndexes.map((p): Promise<string> => this.store.get(`${this.mmrUuid}:hashes:${p}`));
    const peaksHashes = await Promise.all(peaksHashesPromises);
    return peaksHashes;
  }
}

export { IHasher, IStore } from "./types";
