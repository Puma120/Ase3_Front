// Almacenamiento local clave/valor, sincrono, compartido por web y nativo:
// localStorage en la PWA (react-native-web) y expo-secure-store en nativo
// (Keystore de Android). Guarda la sesion, las preferencias de la app y el
// borrador del chat. Nunca lanza: si el almacenamiento falla (modo privado,
// datos bloqueados) la app sigue funcionando con los valores por defecto.
import * as SecureStore from "expo-secure-store";

const hasLocalStorage = typeof localStorage !== "undefined";

export function getItem(key: string): string | null {
  try {
    return hasLocalStorage ? localStorage.getItem(key) : SecureStore.getItem(key);
  } catch {
    return null;
  }
}

export function setItem(key: string, value: string): void {
  try {
    if (hasLocalStorage) localStorage.setItem(key, value);
    else SecureStore.setItem(key, value);
  } catch {
    // sin almacenamiento: el valor vive solo en memoria hasta cerrar la app
  }
}

export function removeItem(key: string): void {
  try {
    if (hasLocalStorage) localStorage.removeItem(key);
    else void SecureStore.deleteItemAsync(key);
  } catch {
    // nada que borrar
  }
}

export function getJSON<T>(key: string, fallback: T): T {
  const raw = getItem(key);
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function setJSON(key: string, value: unknown): void {
  setItem(key, JSON.stringify(value));
}
