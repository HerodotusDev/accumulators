# Pedersen Hash

This library exposes the following functions:

`pub fn pedersen(x: &str, y: &str) -> String`: [Geometry version](https://github.com/geometryresearch/starknet-signatures/blob/722c5987cb96aee80f230a97fed685194c97b7db/packages/prover/src/pedersen.rs).

`pub fn starknet_pedersen(x: Vec<u8>, y: Vec<u8>) -> String`: [Starknet reference implementation](https://github.com/xJonathanLEI/starknet-rs/blob/89a724f00ba6000120b17f68f6da0b4c982eea2f/starknet-crypto/src/pedersen_hash.rs#L19)

`pub fn starknet_pedersen_cairo(x: Vec<u8>, y: Vec<u8>) -> String`: Cairo output format of `starknet_pedersen`.

Note: `pedersen` output is padded to 32 bytes. If an hex string is passed to it, it's expected to be big endian. Otherwise, all inputs are little-endian.

### Building pkg

```sh
$> wasm-pack build --target nodejs --release
```

### Running the benchmark

```sh
$> ts-node benchmark.ts
```
