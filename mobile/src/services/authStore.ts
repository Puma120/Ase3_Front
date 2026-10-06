// Almacenamiento del JWT de sesion. En web (pwa via react-native-web) usa
// localStorage (persiste entre recargas); en nativo usa expo-secure-store
// (Keystore de Android), sincrono, para que la sesion sobreviva al cierre de
// la app y la tarea de ubicacion en segundo plano pueda leerlo.
import { getItem, removeItem, setItem } from "./localStore";

const STORAGE_KEY = "ase3_tdah_token";

export function getToken(): string | null {
  return getItem(STORAGE_KEY);
}

export function setToken(token: string): void {
  setItem(STORAGE_KEY, token);
}

export function clearToken(): void {
  removeItem(STORAGE_KEY);
}
