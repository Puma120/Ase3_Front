// Ubicacion en segundo plano: el telefono avisa su posicion a
// back/proactive_service para que el motor calcule "a que hora salir" con
// trafico real. Precision balanceada y pocos updates para cuidar bateria.
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { getToken } from "../services/authStore";
import { putLocation } from "../services/proactiveApi";

const TASK_NAME = "ase3-background-location";
const PERMS_ASKED_KEY = "ase3_location_perms_asked";

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

export async function startLocationTracking(): Promise<void> {
  if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) return;

  const foreground = await Location.getForegroundPermissionsAsync();
  if (foreground.status !== "granted") {
    if (!foreground.canAskAgain) return;
    const asked = await Location.requestForegroundPermissionsAsync();
    if (asked.status !== "granted") return;
  }

  // Mandar ya la posicion actual, para no esperar al primer update de la tarea.
  try {
    const { coords } = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
    await putLocation(coords.latitude, coords.longitude, coords.accuracy);
  } catch {
    // seguimos: el permiso puede estar bien aunque el GPS tarde.
  }

  // Android 11+ manda al usuario a Ajustes para el permiso "siempre": se pide
  // una sola vez, sin insistir en cada arranque.
  const background = await Location.getBackgroundPermissionsAsync();
  if (background.status !== "granted") {
    if (!background.canAskAgain || (await alreadyAsked())) return;
    await markAsked();
    const asked = await Location.requestBackgroundPermissionsAsync();
    if (asked.status !== "granted") return;
  }

  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 5 * 60 * 1000,
    distanceInterval: 200,
    foregroundService: {
      notificationTitle: "Asistente activo",
      notificationBody: "Usando tu ubicacion para avisarte a que hora salir.",
    },
  });
}

export async function stopLocationTracking(): Promise<void> {
  if (await Location.hasStartedLocationUpdatesAsync(TASK_NAME)) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
}

async function alreadyAsked(): Promise<boolean> {
  const SecureStore = await import("expo-secure-store");
  return SecureStore.getItem(PERMS_ASKED_KEY) === "1";
}

async function markAsked(): Promise<void> {
  const SecureStore = await import("expo-secure-store");
  SecureStore.setItem(PERMS_ASKED_KEY, "1");
}
