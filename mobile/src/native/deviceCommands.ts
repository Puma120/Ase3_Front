// Web (PWA): el navegador no puede crear alarmas ni cambiar No Molestar. La
// version nativa vive en deviceCommands.native.ts (Metro la prefiere).
import type { DeviceCommand } from "../services/chatApi";

export async function runDeviceCommands(commands: DeviceCommand[]): Promise<string[]> {
  return commands.length ? ["Esa accion solo esta disponible en la app de Android."] : [];
}
