// Push web (PWA): registra el token FCM del navegador en back/proactive_service.
// El aviso lo muestra el service worker (pwa/public/sw.js). Funciona en Chrome
// Android y en iOS 16.4+ solo con la PWA agregada a la pantalla de inicio. La
// version nativa vive en push.native.ts (Metro la prefiere).
//
// offerPushOnce pide el permiso al abrir la app (Android muestra su dialogo
// del sistema); iOS solo lo acepta dentro de un toque del usuario, asi que ahi
// se repite en el primer toque. enablePush (interruptor de Ajustes) lo pide
// antes de cualquier await por la misma razon.
import { getJSON, setJSON } from "../services/localStore";
import { registerDevice, unregisterDevice } from "../services/proactiveApi";

// App web del proyecto Firebase ase3-b47e4 (valores publicos, como google-services.json).
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDOeIVn2WL4P13ufEOfZvgsztKPe2gQzvY",
  projectId: "ase3-b47e4",
  messagingSenderId: "828031107647",
  appId: "1:828031107647:web:2f9e180f3e30c138beae8a",
};
// Cloud Messaging > Certificados push web (clave publica).
const VAPID_KEY = "BGQXTfxkdGRGFsNO-458Vcx7QXwMpO2bN84AKhKdp8Y4CG_q3H9A8GaO-Ma68hSLV4vgP5yUFIYzBA8b7Utdp4E";

const PREFS_KEY = "ase3_push";
const OFFERED_KEY = "ase3_push_offered";

export interface PushPrefs {
  enabled: boolean;
  sound: boolean;
  bubble: boolean;
}

const DEFAULT_PREFS: PushPrefs = { enabled: false, sound: false, bubble: false };

// En iOS PushManager solo existe con la PWA instalada.
export function isPushSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window &&
    "Notification" in window
  );
}

export function getPushPrefs(): PushPrefs {
  return { ...DEFAULT_PREFS, ...getJSON<Partial<PushPrefs>>(PREFS_KEY, {}) };
}

function savePushPrefs(prefs: PushPrefs): void {
  setJSON(PREFS_KEY, prefs);
}

let currentToken: string | null = null;

async function register(sound: boolean): Promise<void> {
  // main.tsx solo registra sw.js en el build de produccion; en desarrollo
  // (vite dev tambien sirve public/sw.js) se registra aqui al activar avisos.
  const registration =
    (await navigator.serviceWorker.getRegistration()) ?? (await navigator.serviceWorker.register("/sw.js"));
  await navigator.serviceWorker.ready;

  const { initializeApp, getApps } = await import("firebase/app");
  const { getMessaging, getToken } = await import("firebase/messaging");
  const app = getApps()[0] ?? initializeApp(FIREBASE_CONFIG);
  currentToken = await getToken(getMessaging(app), {
    vapidKey: VAPID_KEY,
    serviceWorkerRegistration: registration,
  });
  await registerDevice(currentToken, "web", sound, false);
}

/** Al abrir la app: retoma los avisos solo si el usuario ya los activo y el
 * permiso sigue concedido. Vuelve a registrar el token por si rotó. */
export async function resumePush(): Promise<void> {
  if (!isPushSupported()) return;
  const prefs = getPushPrefs();
  if (!prefs.enabled || Notification.permission !== "granted") return;
  await register(prefs.sound);
}

/** Pide el permiso del navegador. Devuelve false si el usuario lo nego. */
export async function enablePush(sound: boolean): Promise<boolean> {
  // Primero, sin await previo: iOS exige que salga del toque del usuario.
  const status = await Notification.requestPermission();
  if (status !== "granted") {
    savePushPrefs({ ...getPushPrefs(), enabled: false, sound });
    return false;
  }
  // Si falla no se guarda nada: la preferencia sigue apagada (o sin guardar) y
  // offerPushOnce reintenta en la proxima apertura.
  await register(sound);
  savePushPrefs({ ...getPushPrefs(), enabled: true, sound });
  return true;
}

export async function disablePush(): Promise<void> {
  savePushPrefs({ ...getPushPrefs(), enabled: false });
  setJSON(OFFERED_KEY, true);
  await teardownPush();
}

// En web el sonido lo decide el sistema; se guarda igual para el backend.
export async function setPushSound(sound: boolean): Promise<void> {
  const prefs = getPushPrefs();
  savePushPrefs({ ...prefs, sound });
  if (prefs.enabled && currentToken) await registerDevice(currentToken, "web", sound, false);
}

/** Primera apertura: una sola vez pide el permiso del sistema y registra el
 * token. Si ya estaba concedido (Android puede darlo al instalar la PWA) solo
 * registra. Si el usuario lo rechaza, despues vive en Ajustes. */
export async function offerPushOnce(): Promise<void> {
  if (!isPushSupported() || getJSON<boolean>(OFFERED_KEY, false)) return;
  // Preferencia ya guardada: el usuario ya decidio (encendidos o apagados).
  if (getJSON<Partial<PushPrefs> | null>(PREFS_KEY, null) !== null) return;
  if (Notification.permission === "denied") return;
  // Si register falla, OFFERED_KEY no se guarda y se reintenta en la proxima apertura.
  await enablePush(false);
  setJSON(OFFERED_KEY, true);
  // iOS ignora la peticion sin un toque: el permiso sigue sin decidir.
  if (Notification.permission === "default") {
    document.addEventListener("pointerup", () => void enablePush(false).catch(() => {}), { once: true });
  }
}

export function isBubbleSupported(): boolean {
  return false;
}
export async function setPushBubble(_bubble: boolean): Promise<void> {}
export async function openBubbleSettings(): Promise<void> {}

// Se llama antes de borrar el JWT (el DELETE necesita sesion). No cambia la
// preferencia: al volver a entrar, resumePush registra el navegador otra vez.
export async function teardownPush(): Promise<void> {
  if (currentToken) await unregisterDevice(currentToken).catch(() => {});
  currentToken = null;
}
