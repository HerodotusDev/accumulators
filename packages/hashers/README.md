# Hashers

`@accmulators/hashers` library implements the following hashing algorithms:

- Keccak
- Poseidon
- Stark Poseidon
- Stark Pedersen

## Example

```typescript
import { KeccakHasher } from "@accmulators/hashers";

const hasher = new KeccakHasher();

const hash = hasher.hash([`0x1234`, `0x5678`]);

console.log(hash);
```

## Functions

Every hasher supports the following functions:

#### `constructor(options: HasherOptions)` - creates a new hasher instance

Imporant: Don't use constructor for `PoseidonHasher`, use `async create()` function instead.

`HasherOptions` has the following interface:

```typescript
interface HasherOptions {
  blockSizeBits: number;
  shouldPad?: boolean;
}
```

- `blockSizeBits` (default is 256)
- `shouldPad` (defaults is `false`) - if `true` every outputted hash will have the same length and zeros will be padded at the beginning of the string

#### `hashSingle(data: string)`

Hashes a single string. Returns a hexadecimal number as a string (for example `0x1234567890abcdef`).

#### `hash(data: string[])`

Hashes array of string and returns a hexadecimal number as a string.
