// Llamada al endpoint conversacional principal (back/agent_service via el
// gateway, /agent/chat). Contrato espejado de
// back/agent_service/app/schemas/chat.py.

import { Platform } from "react-native";

import { getChatLocation } from "../native/location";
import { apiFetch } from "./apiClient";

export interface DeviceCommand {
  command: string;
  payload: Record<string, unknown>;
}

export interface ChatReply {
  response: string;
  device_commands: DeviceCommand[];
  /** El agente cerro la configuracion inicial de la rutina en este turno. */
  onboarding_done?: boolean;
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

export async function sendMessage(message: string, onboarding = false): Promise<ChatReply> {
  const where = await getChatLocation();
  return apiFetch<ChatReply>("/agent/chat", {
    method: "POST",
    body: JSON.stringify({ message, timezone: deviceTimezone(), lat: where?.lat, lng: where?.lng, onboarding, client: Platform.OS }),
  });
}

// Configuracion inicial de la rutina (back/agent_service /agent/onboarding).
export type OnboardingStatus = "pending" | "done" | "skipped";

export const getOnboarding = () =>
  apiFetch<{ status: OnboardingStatus }>("/agent/onboarding").then((r) => r.status);

export const skipOnboarding = () => apiFetch<{ status: OnboardingStatus }>("/agent/onboarding/skip", { method: "POST" });

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
