// Almacenamiento del JWT de sesion. En web (pwa via react-native-web) usa
// localStorage (persiste entre recargas); en nativo usa expo-secure-store
// (Keystore de Android), sincrono, para que la sesion sobreviva al cierre de
// la app y la tarea de ubicacion en segundo plano pueda leerlo.
import * as SecureStore from "expo-secure-store";

const STORAGE_KEY = "ase3_tdah_token";

const hasLocalStorage = typeof localStorage !== "undefined";

export function getToken(): string | null {
  if (hasLocalStorage) return localStorage.getItem(STORAGE_KEY);
  return SecureStore.getItem(STORAGE_KEY);
}

export function setToken(token: string): void {
  if (hasLocalStorage) {
    localStorage.setItem(STORAGE_KEY, token);
    return;
  }
  SecureStore.setItem(STORAGE_KEY, token);
}

export function clearToken(): void {
  if (hasLocalStorage) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  void SecureStore.deleteItemAsync(STORAGE_KEY);
}
