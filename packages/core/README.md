# `core`

## `Store`

Store is a class that provides a simple interface for storing and retrieving key-value pairs.

Store has the following interface:

```typescript
interface IStore {
  get(key: string): Promise<string | undefined>;
  getMany(keys: string[]): Promise<Map<string, string>>;

  set(key: string, value: string): Promise<void>;
  setMany(values: Map<string, string>): Promise<void>;

  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
}
```

## Implementations

Store can be implemented in many different ways, for example in memory or database.

Currently there are three implementations:

- [`@accumulators/memory`](../memory/README.md)
- [`@accumulators/rocksdb`](../rocksdb/README.md)
- [`@accumulators/sqlite3`](../sqlite3/README.md)

You can also implement your own store. Just write a class that implements `IStore` interface and you are good to go.
