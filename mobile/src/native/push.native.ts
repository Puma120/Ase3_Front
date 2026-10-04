// Push nativo (Android): registra el token FCM del dispositivo en
// back/proactive_service y muestra los avisos tambien con la app abierta.
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import { registerDevice, unregisterDevice } from "../services/proactiveApi";

export const CHANNEL_ID = "proactive";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let currentToken: string | null = null;
let tokenSubscription: { remove: () => void } | null = null;

export async function setupPush(): Promise<void> {
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
  await registerDevice(currentToken, Platform.OS === "ios" ? "ios" : "android");

  // FCM puede rotar el token: se vuelve a registrar el nuevo.
  tokenSubscription?.remove();
  tokenSubscription = Notifications.addPushTokenListener((next) => {
    currentToken = String(next.data);
    registerDevice(currentToken, Platform.OS === "ios" ? "ios" : "android").catch(() => {});
  });
}

// Se llama antes de borrar el JWT (el DELETE necesita sesion).
export async function teardownPush(): Promise<void> {
  tokenSubscription?.remove();
  tokenSubscription = null;
  if (currentToken) await unregisterDevice(currentToken).catch(() => {});
  currentToken = null;
}
