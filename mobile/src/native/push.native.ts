// Push nativo (Android): registra el token FCM del dispositivo en
// back/proactive_service y muestra los avisos tambien con la app abierta.
//
// expo-notifications lanza una excepcion fatal con solo importarse dentro de
// Expo Go (el push remoto se quito en SDK 53), asi que se carga con require
// solo en un build de desarrollo/produccion. En Expo Go el push queda inactivo.
import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

import { registerDevice, unregisterDevice } from "../services/proactiveApi";

type NotificationsModule = typeof import("expo-notifications");

export const CHANNEL_ID = "proactive";

const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let currentToken: string | null = null;
let tokenSubscription: { remove: () => void } | null = null;

export async function setupPush(): Promise<void> {
  if (inExpoGo) return;
  const Notifications: NotificationsModule = require("expo-notifications");
  const platform = Platform.OS === "ios" ? "ios" : "android";

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Avisos del asistente",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  let { status } = await Notifications.getPermissionsAsync();
  if (status !== "granted") ({ status } = await Notifications.requestPermissionsAsync());
  if (status !== "granted") return;

  const { data } = await Notifications.getDevicePushTokenAsync();
  currentToken = String(data);
  await registerDevice(currentToken, platform);

  // FCM puede rotar el token: se vuelve a registrar el nuevo.
  tokenSubscription?.remove();
  tokenSubscription = Notifications.addPushTokenListener((next) => {
    currentToken = String(next.data);
    registerDevice(currentToken, platform).catch(() => {});
  });
}

// Se llama antes de borrar el JWT (el DELETE necesita sesion).
export async function teardownPush(): Promise<void> {
  tokenSubscription?.remove();
  tokenSubscription = null;
  if (currentToken) await unregisterDevice(currentToken).catch(() => {});
  currentToken = null;
}
