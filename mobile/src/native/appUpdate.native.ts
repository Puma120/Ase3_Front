// Actualizaciones OTA (expo-updates): descarga la ultima version publicada en el
// canal del build y reinicia la app para aplicarla.
import * as Updates from "expo-updates";

export function isAppUpdateSupported(): boolean {
  return Updates.isEnabled;
}

/** true si hay una version nueva publicada. Nunca lanza: sin red o sin canal, false. */
export async function hasAppUpdate(): Promise<boolean> {
  if (!Updates.isEnabled) return false;
  try {
    return (await Updates.checkForUpdateAsync()).isAvailable;
  } catch {
    return false;
  }
}

/** Busca, descarga y aplica la actualizacion. Si ya esta al dia devuelve un
 * mensaje; si hay una nueva, reinicia la app (no regresa). */
export async function updateApp(): Promise<string> {
  try {
    const check = await Updates.checkForUpdateAsync();
    if (!check.isAvailable) return "Ya tienes la última versión.";
    await Updates.fetchUpdateAsync();
    await Updates.reloadAsync();
    return "";
  } catch {
    return "No se pudo buscar la actualización. Revisa tu conexión e inténtalo otra vez.";
  }
}
