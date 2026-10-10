// Llamada al endpoint conversacional principal (back/agent_service via el
// gateway, /agent/chat). Contrato espejado de
// back/agent_service/app/schemas/chat.py.

import { apiFetch } from "./apiClient";

export interface DeviceCommand {
  command: string;
  payload: Record<string, unknown>;
}

export interface ChatReply {
  response: string;
  device_commands: DeviceCommand[];
}

// Zona IANA del dispositivo (ej. America/Mexico_City). El agente la usa para
// interpretar "a las 6" en la hora real del usuario, aunque viaje o cambie
// la zona del telefono sin tocar Ajustes.
function deviceTimezone(): string | undefined {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined;
  } catch {
    return undefined;
  }
}

export function sendMessage(message: string): Promise<ChatReply> {
  return apiFetch<ChatReply>("/agent/chat", {
    method: "POST",
    body: JSON.stringify({ message, timezone: deviceTimezone() }),
  });
}

export interface HistoryMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

// Ultimos mensajes de la conversacion (back/agent_service guarda el
// historial): al volver a la app el usuario ve en que iba.
export function getHistory(limit = 30): Promise<HistoryMessage[]> {
  return apiFetch<HistoryMessage[]>(`/agent/history?limit=${limit}`);
}
