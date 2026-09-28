// Almacenamiento del JWT de sesion. En web (pwa via react-native-web) usa
// localStorage (persiste entre recargas); en nativo no hay localStorage asi
// que cae a memoria (la sesion se pierde al cerrar la app - aceptable para
// este prototipo, evita anadir una dependencia de storage nativo no pedida).
const STORAGE_KEY = "ase3_tdah_token";

const hasLocalStorage = typeof localStorage !== "undefined";

let memoryToken: string | null = null;

export function getToken(): string | null {
  if (hasLocalStorage) return localStorage.getItem(STORAGE_KEY);
  return memoryToken;
}

export function setToken(token: string): void {
  if (hasLocalStorage) {
    localStorage.setItem(STORAGE_KEY, token);
    return;
  }
  memoryToken = token;
}

export function clearToken(): void {
  if (hasLocalStorage) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }
  memoryToken = null;
}
