// Web (PWA): el navegador solo da la ubicacion con la pagina abierta, asi que
// aqui existe unicamente "Usar mi ubicacion en el chat" (Geolocation API, exige
// HTTPS y permiso del usuario). El seguimiento en segundo plano vive en
// location.native.ts (Metro la prefiere).
import { getJSON, setJSON } from "../services/localStore";

const CHAT_KEY = "ase3_chat_location";

export function isLocationSupported(): boolean {
  return false;
}
export function isChatLocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}
export function isLocationEnabled(): boolean {
  return false;
}
export function isChatLocationEnabled(): boolean {
  return getJSON<{ enabled: boolean }>(CHAT_KEY, { enabled: false }).enabled;
}

function currentPosition(timeoutMs: number, maximumAge: number): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!isChatLocationSupported()) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: timeoutMs, maximumAge },
    );
  });
}

/** Desde el interruptor de Ajustes: aqui el navegador pide el permiso. false si lo nego. */
export async function setChatLocation(on: boolean): Promise<boolean> {
  if (on && !(await currentPosition(10000, 0))) {
    setJSON(CHAT_KEY, { enabled: false });
    return false;
  }
  setJSON(CHAT_KEY, { enabled: on });
  return true;
}

/** Posicion para adjuntar al mensaje; null si esta apagado, sin permiso o tarda
 * mas de 4 s (el mensaje sale igual, sin ella). */
export async function getChatLocation(): Promise<{ lat: number; lng: number } | null> {
  return isChatLocationEnabled() ? currentPosition(4000, 2 * 60 * 1000) : null;
}
export async function resumeLocation(): Promise<void> {}
export async function enableLocation(): Promise<boolean> {
  return false;
}
export async function disableLocation(): Promise<void> {}
export async function stopLocationTracking(): Promise<void> {}
