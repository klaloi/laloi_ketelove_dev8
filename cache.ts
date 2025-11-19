// cache.ts ou cache.js dans votre dossier (probablement à la racine ou dans un dossier utils)
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const createTokenCache = () => {
  return {
    getToken: async (key: string) => {
      try {
        return await SecureStore.getItemAsync(key);
      } catch (error) {
        console.error('SecureStore get error:', error);
        return null;
      }
    },
    saveToken: async (key: string, token: string) => {
      try {
        return await SecureStore.setItemAsync(key, token);
      } catch (error) {
        console.error('SecureStore set error:', error);
      }
    },
  };
};

export const tokenCache = Platform.OS !== 'web' ? createTokenCache() : undefined;