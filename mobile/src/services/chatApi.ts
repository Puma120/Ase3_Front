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

export function sendMessage(message: string): Promise<ChatReply> {
  return apiFetch<ChatReply>("/agent/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
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
