import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";

// Tokens are stored in the device keychain (SecureStore) on native, and fall
// back to AsyncStorage on web where SecureStore is unavailable.
const ACCESS_KEY = "care.access";
const REFRESH_KEY = "care.refresh";

const isWeb = Platform.OS === "web";

async function setItem(key: string, value: string) {
  if (isWeb) return AsyncStorage.setItem(key, value);
  return SecureStore.setItemAsync(key, value);
}

async function getItem(key: string) {
  if (isWeb) return AsyncStorage.getItem(key);
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string) {
  if (isWeb) return AsyncStorage.removeItem(key);
  return SecureStore.deleteItemAsync(key);
}

export type StoredSession = { accessToken: string; refreshToken: string };

export async function saveSession(session: StoredSession) {
  await Promise.all([setItem(ACCESS_KEY, session.accessToken), setItem(REFRESH_KEY, session.refreshToken)]);
}

export async function loadSession(): Promise<StoredSession | null> {
  const [accessToken, refreshToken] = await Promise.all([getItem(ACCESS_KEY), getItem(REFRESH_KEY)]);
  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearSession() {
  await Promise.all([deleteItem(ACCESS_KEY), deleteItem(REFRESH_KEY)]);
}
