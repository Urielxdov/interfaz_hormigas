import { IStorage } from "./IStorage";


export class ReactNativeStorage implements IStorage {
  setItem(key: string, value: string): Promise<void> {
    throw new Error("Method not implemented.");
  }
  getItem(key: string): Promise<string | null> {
    throw new Error("Method not implemented.");
  }
  removeItem(key: string): Promise<void> {
    throw new Error("Method not implemented.");
  }

}