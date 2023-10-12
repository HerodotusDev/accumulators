# `sqlite3`

Implementation of [`Store`](../core/README.md#store) interface that uses a sqlite3 table to store data.

After creating an instance of `SqliteStore` remember to call `init` method to initialize the store, unless you are sure that the tables is created in the database.

## Example

```typescript
import SqliteStore from "@accumulators/sqlite3";

const store = new SqliteStore();
await store.init(); // remember to initialize the store

const valuesToSet = new Map<string, string>();
valuesToSet.set("key1", "value1");
valuesToSet.set("key2", "value2");

await store.setMany(valuesToSet);

await store.set("key3", "value3");

const values = await store.getMany(["key2", "key3"]);

console.log(values.get("key2")); // "value2"
```
