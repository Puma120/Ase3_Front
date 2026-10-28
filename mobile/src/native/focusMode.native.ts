// "Control de Enfoque" (back/tools_service/app/tools/device_tool.py): No
// molestar via el modulo nativo modules/focus-mode (solo Android). Un APK
// anterior sin el modulo cae a un aviso en vez de fallar.
import { requireOptionalNativeModule } from "expo";
import { Platform } from "react-native";

interface FocusModeNative {
  hasAccess(): boolean;
  setEnabled(enabled: boolean): boolean;
  openAccessSettings(): void;
}

const native = Platform.OS === "android" ? requireOptionalNativeModule<FocusModeNative>("FocusMode") : null;

export function isFocusModeSupported(): boolean {
  return native !== null;
}

/** Al activar "Modo enfoque" en Ajustes: si Android aun no dio acceso a No molestar,
 * abre esa pantalla (sin acceso el modo automatico no puede cambiar nada). */
export function ensureFocusAccess(): void {
  try {
    if (native && !native.hasAccess()) native.openAccessSettings();
  } catch {
    // sin pantalla de acceso: el usuario puede darlo desde Ajustes del telefono.
  }
}

/** Nota para el chat: el usuario siempre sabe que paso. */
export async function setFocusMode(enabled: boolean): Promise<string> {
  if (!native) return "Esta versión de la app no puede cambiar No molestar. Actualiza la app.";
  try {
    if (native.setEnabled(enabled)) {
      return enabled ? "No molestar activado (suenan alarmas y prioritarias)." : "No molestar desactivado.";
    }
    native.openAccessSettings();
    return "Para cambiar No molestar, activa Oportuno en la pantalla que se abrió y vuelve a pedírmelo.";
  } catch {
    return "No pude cambiar No molestar en este dispositivo.";
  }
}
