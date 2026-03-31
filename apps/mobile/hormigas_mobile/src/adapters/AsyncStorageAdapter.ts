import * as SecureStorage from 'expo-secure-store'
import { IStorage } from '@hormigas/application'

class StorageAdapter implements IStorage {
  async setItem(key: string, value: string): Promise<void> {
    await SecureStorage.setItemAsync(key, value)
    if (__DEV__) {
      console.log('[Storage] Guardado:', key, value)
    }
  }

  async getItem(key: string): Promise<string | null> {
    return SecureStorage.getItemAsync(key)
  }

  async removeItem(key: string): Promise<void> {
    await SecureStorage.deleteItemAsync(key)
  }
}

// singleton directo
export const storage: IStorage = new StorageAdapter()