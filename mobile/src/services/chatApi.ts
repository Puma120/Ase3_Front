// Llamada al endpoint conversacional principal (back/agent_service via el
// gateway, /agent/chat). Contrato espejado de
// back/agent_service/app/schemas/chat.py.

import { apiFetch } from "./apiClient";

export async function sendMessage(message: string): Promise<string> {
  const { response } = await apiFetch<{ response: string }>("/agent/chat", {
    method: "POST",
    body: JSON.stringify({ message }),
  });
  return response;
}
