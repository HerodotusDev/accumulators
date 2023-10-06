# `memory`

Implementation of [`Store`](../core/README.md#store) interface that stores data in memory using `Map`.

## Example

```typescript
import MemoryStore from "@accumulators/memory";

const store = new MemoryStore();

const valuesToSet = new Map<string, string>();
valuesToSet.set("key1", "value1");
valuesToSet.set("key2", "value2");

await store.setMany(valuesToSet);

await store.set("key3", "value3");

const values = await store.getMany(["key2", "key3"]);

console.log(values.get("key2")); // "value2"
```
