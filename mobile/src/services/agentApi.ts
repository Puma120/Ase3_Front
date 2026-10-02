// Parametros del agente por usuario (back/agent_service /agent/params).
// Contrato espejado de back/agent_service/app/memory/params.py.

import { apiFetch } from "./apiClient";

export interface AgentParams {
  short_term_memory_window: number;
  rag_top_k: number;
  llm_temperature: number;
}

export function getAgentParams(): Promise<AgentParams> {
  return apiFetch<AgentParams>("/agent/params");
}

export function updateAgentParams(patch: Partial<AgentParams>): Promise<AgentParams> {
  return apiFetch<AgentParams>("/agent/params", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
