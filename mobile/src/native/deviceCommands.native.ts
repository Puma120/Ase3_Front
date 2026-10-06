// Ejecuta en el dispositivo los comandos que el agente devuelve en /agent/chat
// (back/tools_service/app/tools/device_tool.py). Devuelve una nota por comando
// para mostrarla en el chat: el usuario siempre sabe que paso.
import * as IntentLauncher from "expo-intent-launcher";
import { Platform } from "react-native";

import type { DeviceCommand } from "../services/chatApi";

async function setAlarm(payload: Record<string, unknown>): Promise<string> {
  if (Platform.OS !== "android") return "Las alarmas solo se pueden crear desde la app de Android.";
  const when = new Date(String(payload.time));
  if (Number.isNaN(when.getTime())) return "No pude crear la alarma: la hora no es válida.";
  const hh = String(when.getHours()).padStart(2, "0");
  const mm = String(when.getMinutes()).padStart(2, "0");
  try {
    await IntentLauncher.startActivityAsync("android.intent.action.SET_ALARM", {
      extra: {
        "android.intent.extra.alarm.HOUR": when.getHours(),
        "android.intent.extra.alarm.MINUTES": when.getMinutes(),
        "android.intent.extra.alarm.MESSAGE": String(payload.label ?? ""),
        "android.intent.extra.alarm.SKIP_UI": true,
      },
    });
    return `Alarma creada a las ${hh}:${mm}.`;
  } catch {
    return "No pude crear la alarma en este dispositivo.";
  }
}

export async function runDeviceCommands(commands: DeviceCommand[]): Promise<string[]> {
  const notes: string[] = [];
  for (const { command, payload } of commands) {
    if (command === "set_alarm") notes.push(await setAlarm(payload));
    else if (command === "set_focus_mode")
      // Cambiar No Molestar exige codigo nativo propio; hasta tenerlo se avisa
      // en vez de fingir que se activo.
      notes.push("Todavía no puedo activar No molestar yo solo. Actívalo desde los ajustes del teléfono > No molestar.");
  }
  return notes;
}
