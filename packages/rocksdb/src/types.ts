export type RocksOperationType = "put" | "del";

export type RocksGetResult = string | null;

export interface RocksDBType {
  new (location: string, options?: { createIfMissing: boolean }): RocksDBType;

  isOpen(): boolean;

  isOperational(): boolean;

  open(options?: { createIfMissing: boolean }): Promise<void>;

  close(): Promise<void>;

  get(key: string): Promise<RocksGetResult>;

  getMany(keys: string[]): Promise<Array<RocksGetResult>>;

  put(key: string, value: string): Promise<void>;

  del(key: string): Promise<void>;

  batch(ops: Array<{ type: RocksOperationType; key: string; value?: string }>): Promise<void>;
}
