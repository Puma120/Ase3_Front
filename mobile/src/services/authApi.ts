// Llamadas a back/auth_service via el gateway (/auth/*).
// Contratos espejados de back/auth_service/app/schemas/auth.py.

import { apiFetch } from "./apiClient";

/** Canjea el JWT vigente por uno nuevo de 30 dias (renovacion deslizante). */
export async function refreshToken(): Promise<string> {
  const { access_token } = await apiFetch<{ access_token: string }>("/auth/users/me/refresh", {
    method: "POST",
  });
  return access_token;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
}

export async function getMe(): Promise<User> {
  return apiFetch<User>("/auth/users/me");
}
