# Merkle mountain range

MMR is a structure that allows appending and proving efficiently. Time complexity of both operations is O(log tree_size).

## Example

```typescript
import MemoryStore from "@accumulators/memory";
import { KeccakHasher } from "@accumulators/hashers";
import Mmr from "@accumulators/merkle-mountain-range";

const store = new MemoryStore();
const hasher = new KeccakHasher();

const mmr = new Mmr(store, hasher);

await mmr.append("1");
await mmr.append("2");
await mmr.append("3");
const { elementIndex } = await mmr.append("4");
await mmr.append("5");

const proof = await mmr.getProof(elementIndex);

console.log(await mmr.verifyProof(proof, "4"));
```

## Functions

- [contructor](#constructorstore-store-hasher-hasher-mmrid-string)
- [append](#appendvalue-string)
- [getProof](#getproofelementindex-number-options-proofoptions)
- [verifyProof](#verifyproofproof-proof-elementvalue-string-options-proofoptions)
- [getProofs](#getproofselementsids-number-options-proofoptions)
- [verifyProofs](#verifyproofsproofs-proof-elementsvalues-string-options-proofoptions)
- [getPeaks](#getpeaksoptions-peaksoptions)
- [bagThePeaks](#bagthepeakselementscount-number)
- [calculateRootHash](#calculateroothashbag-string-leafcount-number)
- [retrievePeaksHashes](#retrievepeakshashespeaksidxs-number-formattingoptions-formattingoptions)
- [clear](#clear)

### `constructor(store: Store, hasher: Hasher, mmrId?: string)`

Creates a new MMR with a given `hasher` instance and stores its value in provided `store`.

All the values in `store` have keys prefixes with `mmrId`. If you want to recreate an existing MMR, you need to provide the same `mmrId` as the original MMR. In case you want to create a new MMR, you can omit `mmrId` and it will be generated automatically. `mmrId` can be later accessed using the property (e.g. `myMmr.mmrId`).

### `append(value: string)`

Appends a new value to the MMR. Returns the promise of `AppendResult`.

```typescript
interface AppendResult {
  leavesCount: number; // number of leaves in the mmr after append
  elementsCount: number; // number of all nodes in the mmr after append
  elementIndex: number; // index in the mmr of the appended element
  rootHash: string; // root hash of the mmr after append
}
```

For instance after appending 6th element ot the MMR, the result would be:

```typescript
{
    leavesCount: 6,
    elementsCount: 10,
    elementIndex: 9,
    rootHash: "0x..."
}
```

### `getProof(elementIndex: number, options?: ProofOptions)`

Returns information that is needed to verify the proof of the element with a given `elementIndex`.

```typescript
interface Proof {
  elementIndex: number; // index in the mmr of requested element (same as in function argument)
  elementHash: number; // hash of the requested element
  siblingHashes: string[]; // hashes of all siblings on the path from requested element to the peak
  peaksHashes: string[]; // hashes of all peaks
  elementsCount: number; // number of all nodes in the mmr
}
```

```typescript
interface ProofOptions {
  elementsCount?: number; // You can provide elementsCount if you know its value, so it doesn't have to be fetched from the store
  formattingOpts?: {
    proof: FormattingOptions;
    peaks: FormattingOptions;
  };
}
```

`formattingOpts.proof` apply to `siblingHashes` and `formattingOpts.peaks` apply to `peaksHashes`.

[More about FormattingOptions](#formattingOptions)

### `verifyProof(proof: Proof, elementValue: string, options?: ProofOptions)`

Verifies if a certain element in the MMR has a given value. Returns `true` if the proof is valid, `false` otherwise.

### `getProofs(elementsIds: number[], options?: ProofOptions)`

Same as `getProof` but for multiple elements. Returns an array of `Proof`. Store is accessed for all proofs at once, so it's more efficient than calling `getProof` multiple times.

### `verifyProofs(proofs: Proof[], elementsValues: string[], options?: ProofOptions)`

Same as `verifyProof` but for multiple elements. Returns an array of booleans. Store is accessed for all proofs at once, so it's more efficient than calling `verifyProof` multiple times.

### `getPeaks(options?: PeaksOptions)`

Returns an array of hashes of all peaks in the MMR. The return type is promise of `string[]`.

```typescript
interface PeaksOptions {
  elementsCount?: number; // You can provide elementsCount if you know its value, so it doesn't have to be fetched from the store
  formattingOpts?: FormattingOptions;
}
```

[More about FormattingOptions](#formattingOptions)

### `bagThePeaks(elementsCount?: number)`

Bags all peaks in the MMR and returns the final hash of type promise of `string`.

You can provide `elementsCount` if you know its value, so it doesn't have to be fetched from the store.

### `calculateRootHash(bag: string, leafCount: number)`

Calculates the root hash of the MMR based on the hash returned from `bagThePeaks` function and the size of the MMR. Returns the promise of `string`.

### `retrievePeaksHashes(peaksIdxs: number[], formattingOptions?: FormattingOptions)`

Returns promise of an array of hashes of peaks with given indexes. If `formattingOptions` are provided, the array will be formatted according to them.

[More about FormattingOptions](#formattingOptions)

### `clear()`

Clears all the MMR data from the store.

## Helper functions

All helper functions are static.

### `mapLeafIndexToElementIndex(leafIndex: number)`

Converts leaf index (0-based) to element index.

Table of first few values:

| leafIndex | elementIndex |
| :-------: | :----------: |
|     0     |      1       |
|     1     |      2       |
|     2     |      4       |
|     3     |      5       |
|     4     |      8       |

### `mapElementIndexToLeafIndex(elementIndex: number)`

Converts element index to leaf index (0-based). If the element is not a leaf, it will throw an error.

## FormattingOptions

In some cases you may want peaks and siblings arrays to have a constant size between all requests. In that case you can set formatting options and provide `nullValue` that will be added at the end of an array if it's shorter than `outputSize`. If the array is longer than `outputSize`, it will throw an error.

```typescript
interface FormattingOptions {
  outputSize: number; // size of the output array
  nullValue: string; // value with which the array will be filled
}
```

For example this code

```typescript
const mmr = new Mmr(store, hasher);

await mmr.append("0x1");
await mmr.append("0x2");
await mmr.append("0x3");

const formattingOptions = {
  nullValue: `0x0`,
  outputSize: 4,
};
const options = {
  formattingOpts: {
    peaks: formattingOptions,
    proof: formattingOptions,
  },
};

const proof = await mmr.getProof(2, options);

console.log(proof.peaksHashes);
```

without formatting options would return

```json
["0xe90b7bce...", "0x3"]
```

but with formatting options it will return

```json
["0xe90b7bce...", "0x3", "0x0", "0x0"]
```

(`0xe90b7bce...` is just a `hash("0x1", "0x2")`)
