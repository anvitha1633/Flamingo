import * as SecureStore from "expo-secure-store";

export const expoSecureStorePersistence = {
    type: "persistence",
    async getItem(key) {
        return await SecureStore.getItemAsync(key);
    },
    async setItem(key, value) {
        await SecureStore.setItemAsync(key, value);
    },
    async removeItem(key) {
        await SecureStore.deleteItemAsync(key);
    },
};
