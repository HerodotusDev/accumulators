![](/banner.png)

# ACCUMULATORS

This library contains a collection of packages that accumulate data in [Merkle Mountain Range](packages/merkle-mountain-range/README.md) or [Incremental Merkle Tree](packages/incremental-merkle-tree/README.md) data structures.

## Detailed documentation

- Data structures
  - [merkle-mountain-range](packages/merkle-mountain-range/README.md)
  - [incremental-merkle-tree](packages/incremental-merkle-tree/README.md)
- [Hashers](packages/hashers/README.md)
- [Core](packages/core/README.md)
- Stores
  - [Memory](packages/memory/README.md)
  - [RocksDB](packages/rocksdb/README.md)
  - [SQLite3](packages/sqlite3/README.md)

## Example

Merkle Mountain Range example:

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

console.log(await mmr.verifyProof(proof, "4")); // true
```

Incremental Merkle Tree example:

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
