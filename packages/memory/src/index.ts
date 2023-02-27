import { IStore } from "@merkle-mountain-range/core";

export class MMRInMemoryStore implements IStore {
  // TODO: implement
  get(key: string): Promise<string> {
    throw new Error("Method not implemented.");
  }

  // TODO: implement
  set(key: string, value: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

  // TODO: implement
  delete(key: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
