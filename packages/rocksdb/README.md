# `rocksdb`

Implementation of [`Store`](../core/README.md#store) interface that uses a rocksdb database to store data.

After creating an instance of `RocksDBStore` remember to call `init` method to initialize the store.

## Example

```typescript
import RocksDBStore from "@accumulators/rocksdb";

const store = new RocksDBStore();
await store.init(); // remember to initialize the store

const valuesToSet = new Map<string, string>();
valuesToSet.set("key1", "value1");
valuesToSet.set("key2", "value2");

await store.setMany(valuesToSet);

await store.set("key3", "value3");

const values = await store.getMany(["key2", "key3"]);

console.log(values.get("key2")); // "value2"
```
