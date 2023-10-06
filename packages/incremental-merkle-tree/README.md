# Incremental Merkle Tree

Incremental Merkle Tree is a structure that contains a constant amount of hashes, allows updating a given hash and proving efficiently. Time complexity of both operations is O(log tree_size).

## Example

```typescript
import MemoryStore from "@accumulators/memory";
import { KeccakHasher } from "@accumulators/hashers";
import { IncrementalMerkleTree } from "@accumulators/incremental-merkle-tree";

const store = new MemoryStore();
const hasher = new KeccakHasher();

const tree = await IncrementalMerkleTree.initialize(4, "0x0", hasher, store);

const proof = await tree.getInclusionProof(2);
console.log(await tree.verifyProof(2, "0x0", proof)); // true

await tree.update(2, "0x0", "0x1", proof);

console.log(await tree.verifyProof(2, "0x0", proof)); // false
console.log(await tree.verifyProof(2, "0x1", proof)); // true
```

## Functions

- [initialize](#initializetreesize-number-nullvalue-string-hasher-hasher-store-store-treeid-string)
- [getRoot](#getroot)
- [getInclusionProof](#getinclusionproofindex-number)
- [verifyProof](#verifyproofindex-number-value-string-proof-string)
- [update](#updateindex-number-oldvalue-string-newvalue-string-proof-string)
- [getInclusionMultiProof](#getinclusionmultiproofindexes-number)
- [verifyMultiProof](#verifymultiproofindexes-number-values-string-proof-string)

---

### `initialize(treeSize: number, nullValue: string, hasher: Hasher, store: Store, treeId?: string)`

Creates a new Incremental Merkle Tree of a given `treeSize` and fills all leaves with value `nullValue`. Returns the promise of `IncrementalMerkleTree`.

All the values in `store` have keys prefixes with `treeId`. If you want to recreate an existing Merkle Tree, you need to provide the same `treeId` as the original one. In case you want to create a new tree, you can omit `treeId` and it will be generated automatically. `treeId` can be later accessed using the property (e.g. `myTree.treeId`).

---

### `getRoot()`

Returns the promise of a `string` of hexadecimal number which is the root hash of the tree.

---

### `getInclusionProof(index: number)`

Returns the promise of `string[]` for a given `index` (0-based). The array contains hashes of all siblings of nodes on the path from the leaf to the root.

---

### `verifyProof(index: number, value: string, proof: string[])`

Returns the promise of `boolean` which is `true` if the `value` is in the tree at `index` (0-based) and `false` otherwise.

`proof` is an array of hashes returned by `getInclusionProof`.

---

### `update(index: number, oldValue: string, newValue: string, proof: string[])`

Changes the value of the leaf at `index` (0-based) from `oldValue` to `newValue`. `proof` is an array of hashes returned by `getInclusionProof`.

If provided `oldValue` or `proof` is incorrect, the function will throw an error.

---

### `getInclusionMultiProof(indexes: number[])`

Returns the promise of `string[]` for a given `indexes` (0-based). The array contains hashes of all siblings of nodes on the path from the leaves to the root.

---

### `verifyMultiProof(indexes: number[], values: string[], proof: string[])`

Returns the promise of `boolean` which is `true` if and only if for every `i` value at position `indexes[i]` (0-based) is equal to `values[i]` and `proof` is a valid proof for all of them.
