import { Platform } from "react-native";

// Native-only entry point for the "Control de Enfoque" tool
// (back/tools_service/app/tools/device_tool.py). Sin API pública en iOS
// (ver project_map.md) — gateado a Android, no soportado en front/pwa.
export function isFocusModeSupported(): boolean {
  return Platform.OS === "android";
}
