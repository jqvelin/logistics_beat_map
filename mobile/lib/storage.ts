import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'accessToken';

export async function getStoredToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function setStoredToken(token: string) {
  return SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function clearStoredToken() {
  return SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}
