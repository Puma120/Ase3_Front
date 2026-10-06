// Push nativo (Android): registra el token FCM del dispositivo en
// back/proactive_service y muestra los avisos tambien con la app abierta.
//
// Decision 1 del documento de diseno TDAH: nada interrumpe sin permiso. El
// permiso se pide solo cuando el usuario activa "Avisos en este telefono" en
// Ajustes (enablePush), nunca al abrir la app; al arrancar, resumePush solo
// retoma lo que el usuario ya activo. Por defecto los avisos no suenan.
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

import { getJSON, setJSON } from "../services/localStore";
import { registerDevice, unregisterDevice } from "../services/proactiveApi";

type NotificationsModule = typeof import("expo-notifications");

// back/proactive_service elige el canal segun el `sound` del dispositivo.
export const CHANNEL_SILENT = "avisos_silencio";
export const CHANNEL_SOUND = "avisos_sonido";
const LEGACY_CHANNEL = "proactive";

const PREFS_KEY = "ase3_push";

export interface PushPrefs {
  enabled: boolean;
  sound: boolean;
}

export function isPushSupported(): boolean {
  return Platform.OS === "android" && !inExpoGo;
}

export function getPushPrefs(): PushPrefs {
  return getJSON<PushPrefs>(PREFS_KEY, { enabled: false, sound: false });
}

function savePushPrefs(prefs: PushPrefs): void {
  setJSON(PREFS_KEY, prefs);
}

// expo-notifications lanza una excepcion fatal con solo importarse dentro de
// Expo Go (el push remoto se quito en SDK 53), asi que se carga con require la
// primera vez que se usa y solo en un build real. En Expo Go el push queda
// desactivado (isPushSupported() = false) y la app funciona igual.
type NotificationsModule = typeof import("expo-notifications");

const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let loaded: NotificationsModule | null = null;
function Notifications(): NotificationsModule {
  if (!loaded) {
    loaded = require("expo-notifications") as NotificationsModule;
    loaded.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: getPushPrefs().sound,
        shouldSetBadge: false,
      }),
    });
  }
  return loaded;
}

let currentToken: string | null = null;
let tokenSubscription: { remove: () => void } | null = null;

const platform = () => (Platform.OS === "ios" ? "ios" : "android") as "ios" | "android";

async function ensureChannels(): Promise<void> {
  if (Platform.OS !== "android") return;
  await Notifications().setNotificationChannelAsync(CHANNEL_SILENT, {
    name: "Avisos sin sonido",
    importance: Notifications().AndroidImportance.DEFAULT,
    sound: null,
    enableVibrate: false,
  });
  await Notifications().setNotificationChannelAsync(CHANNEL_SOUND, {
    name: "Avisos con sonido",
    importance: Notifications().AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
  });
  // El canal anterior sonaba siempre; Android no deja bajarle el volumen
  // desde la app, asi que se reemplaza por los dos de arriba.
  await Notifications().deleteNotificationChannelAsync(LEGACY_CHANNEL).catch(() => {});
}

async function register(sound: boolean): Promise<void> {
  const { data } = await Notifications().getDevicePushTokenAsync();
  currentToken = String(data);
  await registerDevice(currentToken, platform(), sound);

  // FCM puede rotar el token: se vuelve a registrar el nuevo.
  tokenSubscription?.remove();
  tokenSubscription = Notifications().addPushTokenListener((next) => {
    currentToken = String(next.data);
    registerDevice(currentToken, platform(), getPushPrefs().sound).catch(() => {});
  });
}

/** Al abrir la app: retoma los avisos solo si el usuario ya los activo y el
 * permiso sigue concedido. Nunca muestra el dialogo de permiso. */
export async function resumePush(): Promise<void> {
  if (!isPushSupported()) return;
  const stored = getJSON<PushPrefs | null>(PREFS_KEY, null);
  const { status } = await Notifications().getPermissionsAsync();
  // Instalaciones anteriores (sin preferencia guardada) que ya habian
  // concedido el permiso: se mantienen los avisos, pero sin sonido.
  const prefs = stored ?? { enabled: status === "granted", sound: false };
  if (!stored) savePushPrefs(prefs);
  if (!prefs.enabled || status !== "granted") return;
  await ensureChannels();
  await register(prefs.sound);
}

/** Desde el interruptor de Ajustes: aqui si se pide el permiso. Devuelve
 * false si el usuario lo nego. */
export async function enablePush(sound: boolean): Promise<boolean> {
  // En Android 13+ el dialogo solo aparece si ya existe un canal.
  await ensureChannels();
  let { status } = await Notifications().getPermissionsAsync();
  if (status !== "granted") ({ status } = await Notifications().requestPermissionsAsync());
  if (status !== "granted") {
    savePushPrefs({ enabled: false, sound });
    return false;
  }
  savePushPrefs({ enabled: true, sound });
  await register(sound);
  return true;
}

export async function disablePush(): Promise<void> {
  savePushPrefs({ ...getPushPrefs(), enabled: false });
  await teardownPush();
}

export async function setPushSound(sound: boolean): Promise<void> {
  const prefs = getPushPrefs();
  savePushPrefs({ ...prefs, sound });
  if (prefs.enabled && currentToken) await registerDevice(currentToken, platform(), sound);
}

// Se llama antes de borrar el JWT (el DELETE necesita sesion). No cambia la
// preferencia: al volver a entrar, resumePush registra el dispositivo otra vez.
export async function teardownPush(): Promise<void> {
  tokenSubscription?.remove();
  tokenSubscription = null;
  if (currentToken) await unregisterDevice(currentToken).catch(() => {});
  currentToken = null;
}
