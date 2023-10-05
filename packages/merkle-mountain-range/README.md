# Merkle mountain range

MMR is a structure that allows appending and proving efficiently. Time complexity of both operations is O(log tree_size).

## Example

```typescript
import MemoryStore from "@accumulators/memory";
import { KeccakHasher } from "@accumulators/hashers";
import CoreMMR from "@accumulators/merkle-mountain-range";

const store = new MemoryStore();
const hasher = new KeccakHasher();

const mmr = new CoreMMR(store, hasher);

await mmr.append("1"); // elementIndex = 1
await mmr.append("2"); // elementIndex = 2
await mmr.append("3"); // elementIndex = 4
await mmr.append("4"); // elementIndex = 5
await mmr.append("5"); // elementIndex = 8

const proof = await mmr.getProof(5);

console.log(await mmr.verifyProof(proof, "4"));
```

## Functions

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

[More about FormattingOptions](#formattingOptions)

### `verifyProof(proof: Proof, elementValue: string, options?: ProofOptions)`

Verifies if a certain element in the MMR has a given value. Returns `true` if the proof is valid, `false` otherwise.

## FormattingOptions

In some cases you may want peaks and siblings arrays to have a constant size between all requests. In that case you can set formatting options and provide `nullValue` that will be added at the end of an array if it's shorter than `outputSize`. If the array is longer than `outputSize`, it will throw an error.

TODO: maybe add example
