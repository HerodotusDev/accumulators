import { HexString, IHasher, IStore } from "@accumulators/core";
import { TreeDatabase } from "./tree-database";

type InclusionProof = string[];
type Node = { hash: string; index: number; depth: number };

export class IncrementalMerkleTree extends TreeDatabase {
  constructor(
    public readonly size: number,
    private readonly nullValue: HexString,
    private readonly hasher: IHasher,
    store: IStore,
    treeId?: string
  ) {
    super(store, treeId);
  }

  static async initialize(
    size: number,
    nullValue: HexString,
    hasher: IHasher,
    store: IStore,
    treeId?: string
  ): Promise<IncrementalMerkleTree> {
    const tree = new IncrementalMerkleTree(size, nullValue, hasher, store, treeId);
    const nodes = tree.renderEmptyTree();
    await tree.nodes.setMany(
      nodes
        .flat()
        .reduce((acc, curr) => ({ ...acc, [`${curr.depth.toString()}:${curr.index.toString()}`]: curr.hash }), {})
    );
    await tree.rootHash.set(nodes[nodes.length - 1][0].hash);
    return tree;
  }

  async getRoot(): Promise<string> {
    return this.rootHash.get();
  }

  /**
   * Generates a multi inclusion proof
   *
   * @param indexesToProve array of indexes of leaves to prove, has to be sorted in ascending order
   * @returns InclusionMultiProof
   */
  async getInclusionMultiProof(indexesToProve: number[]): Promise<InclusionProof> {
    //? Get the tree depth
    const treeDepth = this.getTreeDepth();
    //? [kv, isNeeded] - the key for the key-value store and a flag if it's needed in the proof
    //? We add the leaves to the proof and mark them as not needed
    const proof: Map<string, boolean> = new Map(indexesToProve.map((idx) => [`${treeDepth}:${idx}`, false]));

    let currentLevel = proof;
    for (let currDepth = treeDepth; currDepth > 0; currDepth--) {
      let nextLevel: typeof proof = new Map();
      //? Map through all nodes in the current level
      for (const [kv] of currentLevel) {
        const currentNodeIdx = Number(kv.split(":")[1]);
        //? Calculates the "child" - the product of hashing the two nodes
        const childIdx = Math.floor(currentNodeIdx / 2);
        //? If the child is already in the proof, it means we already calculated it
        if (nextLevel.has(`${currDepth - 1}:${childIdx}`)) continue;

        //? Calculates the neighbour of the node
        const isEven = currentNodeIdx % 2 === 0;
        const neighbourIdx = isEven ? currentNodeIdx + 1 : currentNodeIdx - 1;

        //? Checks if the neighbour is already in the proof
        //? If not, then this is a node that needs to come from the tree and is needed in the proof
        if (!proof.has(`${currDepth}:${neighbourIdx}`)) proof.set(`${currDepth}:${neighbourIdx}`, true);
        //? This is a calculated node, not needed in the proof
        nextLevel.set(`${currDepth - 1}:${childIdx}`, false);
      }
      nextLevel.forEach((value, key) => proof.set(key, value));
      currentLevel = nextLevel;
    }

    let kvEntries = new Array<string>();
    proof.forEach((isNeeded, kv) => isNeeded && kvEntries.push(kv));
    //? Getting all values in one db read
    const nodes = await this.nodes.getMany(kvEntries);

    return [...nodes.values()];
  }

  /**
   * Verifies a multi inclusion proof
   */
  async verifyMultiProof(indexes: number[], values: HexString[], proof: string[]): Promise<boolean> {
    //? Get the root hash of the tree
    const root = await this.rootHash.get();
    //? Calculate the root hash from the indexes, values and proof
    const calculatedRoot = this.calculateMultiproofRootHash(indexes, values, proof);
    //? Compare the two roots
    return root == calculatedRoot;
  }

  /**
   * Recursively calculates the root hash from the indexes, values and proof
   */
  private calculateMultiproofRootHash(indexes: number[], values: string[], proof: InclusionProof) {
    const newIndexes = [];
    const newValues = [];

    while (indexes.length > 0) {
      //? Take the first index and value
      const index = indexes.shift();
      const value = values.shift();
      //? Check if the index is even or odd
      const isEven = index % 2 === 0;
      //? Calculate the wanted index
      const wantedIndex = isEven ? index + 1 : index - 1;
      //? Look for the wanted value in the available values, find it's index
      const wantedValueI = indexes.findIndex((idx) => idx === wantedIndex);

      let wantedValue = null;
      if (wantedValueI === -1) {
        //? If the value is not in the available values, we take it from the proof
        wantedValue = proof?.shift();
      } else {
        //? If the value is in the available values, we take it from there
        wantedValue = values.splice(wantedValueI, 1)[0];
        //? We also remove the index from the available indexes, as we already "used" it
        indexes.splice(wantedValueI, 1);
      }
      //? This means the proof is invalid and we return false to avoid a throw from hashing function
      if (!wantedValue) return false;

      //? Hash the two values in the correct order
      const hash = isEven ? this.hasher.hash([value, wantedValue]) : this.hasher.hash([wantedValue, value]);
      //? Push the hash and the new index to the new values and indexes (next level of the tree)
      newIndexes.push(Math.floor(index / 2));
      newValues.push(hash);
    }

    //? If there are more values to be hashed, we call the function recursively
    if (proof.length > 0 || newIndexes.length > 1)
      return this.calculateMultiproofRootHash(newIndexes, newValues, proof);

    //? The last value is the root
    return newValues[0];
  }

  async getInclusionProof(index: number): Promise<InclusionProof> {
    const requiredNodesByHeight = new Map<number, number>();
    const treeDepth = this.getTreeDepth();
    let currentIndex = index;
    for (let i = treeDepth; i > 0; i--) {
      const isCurrentIndexEven = currentIndex % 2 === 0;
      const neighbour = isCurrentIndexEven ? currentIndex + 1 : currentIndex - 1;
      currentIndex = Math.floor(currentIndex / 2);
      requiredNodesByHeight.set(i, neighbour);
    }

    const kvEntries: string[] = [];
    for (const [height, index] of requiredNodesByHeight.entries()) {
      kvEntries.push(`${height}:${index}`);
    }
    const nodes = await this.nodes.getMany(kvEntries);

    return [...nodes.values()];
  }

  async verifyProof(index: number, value: HexString, proof: InclusionProof): Promise<boolean> {
    let currentIndex = index;
    let currentValue = value;

    for (const p of proof) {
      const isCurrentIndexEven = currentIndex % 2 === 0;
      currentValue = isCurrentIndexEven ? this.hasher.hash([currentValue, p]) : this.hasher.hash([p, currentValue]);
      currentIndex = Math.floor(currentIndex / 2);
    }

    const root = await this.rootHash.get();
    return root == currentValue;
  }

  async update(index: number, oldValue: HexString, newValue: HexString, proof: InclusionProof): Promise<string> {
    const isProofValid = await this.verifyProof(index, oldValue, proof);
    if (!isProofValid) throw new Error("Invalid proof");

    const kvUpdates: Record<string, string> = {};

    let currentIndex = index;
    let currentDepth = this.getTreeDepth();
    let currentValue = newValue;

    kvUpdates[`${currentDepth}:${currentIndex}`] = currentValue;
    for (const p of proof) {
      const isCurrentIndexEven = currentIndex % 2 === 0;

      currentValue = isCurrentIndexEven ? this.hasher.hash([currentValue, p]) : this.hasher.hash([p, currentValue]);

      currentDepth--;
      currentIndex = Math.floor(currentIndex / 2);
      if (currentDepth === 0) break;
      kvUpdates[`${currentDepth}:${currentIndex}`] = currentValue;
    }

    await this.nodes.setMany(kvUpdates);
    await this.rootHash.set(currentValue);
    return currentValue;
  }

  async updateAuthenticated(index: number, value: HexString): Promise<string> {
    let currentIndex = index;
    let currentDepth = this.getTreeDepth();
    const kvGets: string[] = [];
    while (currentDepth > 0) {
      const neighbourIndex = currentIndex % 2 === 0 ? currentIndex + 1 : currentIndex - 1;
      kvGets.push(`${currentDepth}:${neighbourIndex}`);
      currentDepth--;
      currentIndex = Math.floor(currentIndex / 2);
    }
    const neighbours = await this.nodes.getMany(kvGets);

    currentIndex = index;
    currentDepth = this.getTreeDepth();
    const kvUpdates: Record<string, string> = { [`${currentDepth}:${currentIndex}`]: value };
    let currentValue = value;
    while (currentDepth > 0) {
      const isCurrentIndexEven = currentIndex % 2 === 0;
      const neighbourIndex = isCurrentIndexEven ? currentIndex + 1 : currentIndex - 1;
      const neighbour = neighbours.get(`${currentDepth}:${neighbourIndex}`);
      currentValue = isCurrentIndexEven
        ? this.hasher.hash([currentValue, neighbour])
        : this.hasher.hash([neighbour, currentValue]);
      currentDepth--;
      currentIndex = Math.floor(currentIndex / 2);
      kvUpdates[`${currentDepth}:${currentIndex}`] = currentValue;
    }
    await this.nodes.setMany(kvUpdates);
    await this.rootHash.set(currentValue);
    return currentValue;
  }

  private getTreeDepth(): number {
    return Math.ceil(Math.log2(this.size));
  }

  private renderEmptyTree(): Node[][] {
    let currentHeightNodesCount = this.size;
    let currentDepth = this.getTreeDepth();
    const tree: Node[][] = [
      new Array(this.size).fill(0).map((_, index) => ({ hash: this.nullValue, index: index, depth: currentDepth })),
    ];

    while (currentHeightNodesCount > 1) {
      currentDepth--;
      const currentHeightNodes = tree[tree.length - 1];
      const nextHeightNodes = [];
      for (let i = 0; i < currentHeightNodesCount; i += 2) {
        const leftSibling = currentHeightNodes[i].hash;
        const rightSibling = currentHeightNodes[i + 1]?.hash ?? this.nullValue;

        const node: Node = {
          hash: this.hasher.hash([leftSibling, rightSibling]),
          index: Math.floor(i / 2),
          depth: currentDepth,
        };
        nextHeightNodes.push(node);
      }
      tree.push(nextHeightNodes);
      currentHeightNodesCount = nextHeightNodes.length;
    }
    return tree;
  }
}
