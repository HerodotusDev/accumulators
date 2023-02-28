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

    let lastElementIdx = await this.incrementElementsCount();
    const leafIdx = lastElementIdx;

    //? hash that will be stored in the database
    const hash = this.hasher.hash([lastElementIdx.toString(), value]);

    //? Store the hash in the database
    await this.store.set(`${this.mmrUuid}:hashes:${lastElementIdx}`, hash);

    let height = 0;
    while (getHeight(lastElementIdx + 1) > height) {
      lastElementIdx++;

      const left = lastElementIdx - parentOffset(height);
      const right = left + siblingOffset(height);

      const leftHash = await this.store.get(`${this.mmrUuid}:hashes:${left}`);
      const rightHash = await this.store.get(`${this.mmrUuid}:hashes:${right}`);

      const parentHash = this.hasher.hash([lastElementIdx.toString(), this.hasher.hash([leftHash, rightHash])]);
      await this.store.set(`${this.mmrUuid}:hashes:${lastElementIdx}`, parentHash);
      height++;
    }

    //? Update latest value.
    await this.setElementsCount(lastElementIdx);

    //? Compute the new root hash
    const rootHash = await this.bagThePeaks();
    await this.setRootHash(rootHash);

    const leaves = await this.incrementLeavesCount();
    //? Returns the new total number of leaves.
    return {
      leavesCount: leaves,
      leafIdx: leafIdx.toString(),
      rootHash,
      lastPos: lastElementIdx, //? Tree size
    };
  }

  async bagThePeaks(): Promise<string> {
    const lastElementId = await this.getElementsCount();
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
    const peaksHashesPromises = peaksIdxs.map((p) => this.store.get(`${this.mmrUuid}:hashes:${p}`));
    return Promise.all(peaksHashesPromises);
  }
}

export { IHasher, IStore } from "./types";
