import { IStore, TREE_METADATA_KEYS } from "./types";

export class TreesDatabase {
  constructor(protected readonly store: IStore) {}

  // LEAFS METHODS

  protected async incrementLeavesCount(): Promise<number> {
    const leafCount = await this.getLeavesCount();
    const newLeafCount = leafCount + 1;
    await this.store.set(TREE_METADATA_KEYS.LEAF_COUNT, newLeafCount.toString());
    return newLeafCount;
  }

  protected async getLeavesCount(): Promise<number> {
    const leafCount = await this.store.get(TREE_METADATA_KEYS.LEAF_COUNT);
    return leafCount ? parseInt(leafCount) : 0;
  }

  protected async setLeavesCount(count: number): Promise<void> {
    if (isNaN(count)) throw new Error("Leaf count is not a number");
    await this.store.set(TREE_METADATA_KEYS.LEAF_COUNT, count.toString());
  }

  // ELEMENTS METHODS

  protected async incrementElementsCount(): Promise<number> {
    const elementsCount = await this.getElementsCount();
    const newElementsCount = elementsCount + 1;
    await this.store.set(TREE_METADATA_KEYS.ELEMENTS_COUNT, newElementsCount.toString());
    return newElementsCount;
  }

  protected async getElementsCount(): Promise<number> {
    const elementsCount = await this.store.get(TREE_METADATA_KEYS.ELEMENTS_COUNT);
    return elementsCount ? parseInt(elementsCount) : 0;
  }

  protected async setElementsCount(count: number): Promise<void> {
    if (isNaN(count)) throw new Error("Elements count is not a number");
    await this.store.set(TREE_METADATA_KEYS.ELEMENTS_COUNT, count.toString());
  }

  // ROOT HASH METHODS

  protected async getRootHash(): Promise<string> {
    return await this.store.get(TREE_METADATA_KEYS.ROOT_HASH);
  }

  protected async setRootHash(rootHash: string): Promise<void> {
    await this.store.set(TREE_METADATA_KEYS.ROOT_HASH, rootHash);
  }
}
