import * as SecureStorage from 'expo-secure-store'
import { IStorage } from '@hormigas/application'

/** Almacenamiento seguro de la sesion (token). No escribe valores en logs. */
class StorageAdapter implements IStorage {
  async setItem(key: string, value: string): Promise<void> {
    await SecureStorage.setItemAsync(key, value)
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
