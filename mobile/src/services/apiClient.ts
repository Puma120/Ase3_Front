// Thin fetch wrapper for the API Gateway (back/gateway, puerto 8000).
// Uses global fetch, available on both React Native and the web (pwa)
// target, so this file is reused as-is by front/pwa.

import { clearToken, getToken } from "./authStore";
import { setLoggedIn } from "./session";

export const GATEWAY_URL =
  (typeof process !== "undefined" ? process.env.EXPO_PUBLIC_GATEWAY_URL : undefined) ??
  "http://localhost:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const token = getToken();
  const response = await fetch(`${GATEWAY_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  });

  if (!response.ok) {
    // JWT vencido o invalido: se cierra la sesion para volver al login (en vez de
    // dejar la app mostrando errores). Solo si habiamos mandado un token.
    if (response.status === 401 && token) {
      clearToken();
      setLoggedIn(false);
    }
    // El backend (FastAPI) devuelve {"detail": "..."} en errores.
    const body = await response.json().catch(() => null);
    const detail = body?.detail;
    throw new ApiError(
      response.status,
      typeof detail === "string" ? detail : `Error ${response.status}`,
    );
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
