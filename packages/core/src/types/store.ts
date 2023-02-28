export interface IStore {
  get(key: string): Promise<string | undefined>;
  getMany(keys: string[]): Promise<Map<string, string>>;

  set(key: string, value: string): Promise<void>;
  setMany(entries: Map<string, string>): Promise<void>;

  delete(key: string): Promise<void>;
  deleteMany(keys: string[]): Promise<void>;
}
