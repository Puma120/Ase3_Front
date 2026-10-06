// Ubicacion en segundo plano: el telefono avisa su posicion a
// back/proactive_service para que el motor calcule "a que hora salir" con
// trafico real. Precision balanceada y pocos updates para cuidar bateria.
//
// Como con los avisos (push.native.ts), el permiso se pide solo cuando el
// usuario activa "Avisarme a qué hora salir" en Ajustes (enableLocation);
// al abrir la app, resumeLocation solo retoma lo ya activado.
import * as Location from "expo-location";
import { Platform } from "react-native";
import * as TaskManager from "expo-task-manager";

import { getToken } from "../services/authStore";
import { getJSON, setJSON } from "../services/localStore";
import { putLocation } from "../services/proactiveApi";

const TASK_NAME = "ase3-background-location";
const PREFS_KEY = "ase3_location";

// defineTask debe ejecutarse al cargar el bundle (index.ts lo importa) para
// que Android pueda despertar la tarea con la app cerrada.
TaskManager.defineTask<{ locations: Location.LocationObject[] }>(TASK_NAME, async ({ data, error }) => {
  if (error || !data?.locations?.length || !getToken()) return;
  const { latitude, longitude, accuracy } = data.locations[data.locations.length - 1].coords;
  try {
    await putLocation(latitude, longitude, accuracy);
  } catch {
    // sin red o sesion vencida: el siguiente update reintenta.
  }
});

export function isLocationSupported(): boolean {
  return Platform.OS === "android";
}

export function isLocationEnabled(): boolean {
  return getJSON<{ enabled: boolean }>(PREFS_KEY, { enabled: false }).enabled;
}

async function start(): Promise<void> {
  // Mandar ya la posicion actual, para no esperar al primer update de la tarea.
  try {
    const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await putLocation(coords.latitude, coords.longitude, coords.accuracy);
  } catch {
    // seguimos: el permiso puede estar bien aunque el GPS tarde.
  }

  const background = await Location.getBackgroundPermissionsAsync();
  if (background.status !== "granted") return;
  if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) return;
  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 5 * 60 * 1000,
    distanceInterval: 200,
    foregroundService: {
      notificationTitle: "Asistente activo",
      notificationBody: "Usa tu ubicación para avisarte a qué hora salir.",
    },
  });
}

/** Al abrir la app: nunca pide permisos. */
export async function resumeLocation(): Promise<void> {
  const stored = getJSON<{ enabled: boolean } | null>(PREFS_KEY, null);
  const foreground = await Location.getForegroundPermissionsAsync();
  // Instalaciones anteriores que ya habian concedido el permiso lo conservan.
  const enabled = stored ? stored.enabled : foreground.status === "granted";
  if (!stored) setJSON(PREFS_KEY, { enabled });
  if (!enabled || foreground.status !== "granted") return;
  await start();
}

/** Desde el interruptor de Ajustes: aqui si se piden los permisos. Devuelve
 * false si el usuario nego la ubicacion. */
export async function enableLocation(): Promise<boolean> {
  let foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status !== "granted" && foreground.canAskAgain) {
    foreground = await Location.requestForegroundPermissionsAsync();
  }
  if (foreground.status !== "granted") {
    setJSON(PREFS_KEY, { enabled: false });
    return false;
  }
  // Android 11+ manda al usuario a Ajustes para el permiso "siempre".
  const background = await Location.getBackgroundPermissionsAsync();
  if (background.status !== "granted" && background.canAskAgain) {
    await Location.requestBackgroundPermissionsAsync();
  }
  setJSON(PREFS_KEY, { enabled: true });
  await start();
  return true;
}

export async function disableLocation(): Promise<void> {
  setJSON(PREFS_KEY, { enabled: false });
  await stopLocationTracking();
}

// Al cerrar sesion: detiene la tarea sin cambiar la preferencia.
export async function stopLocationTracking(): Promise<void> {
  if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
}
