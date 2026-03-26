import { IStorage } from "@hormigas/application";
import AsyncStorage from '@react-native-async-storage/async-storage'


export class RNStorage implements IStorage {
    async setItem(key: string, value: string) {
        await AsyncStorage.setItem(key, value);
    }

    async getItem(key: string) {
        return AsyncStorage.getItem(key);
    }

    async removeItem(key: string) {
        await AsyncStorage.removeItem(key);
    }
}