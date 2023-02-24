export interface IKeyValueStore {
  get(key: string): Promise<string | undefined>;
  
}
