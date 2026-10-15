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

/** Acceso con email y contrasena, alterno al login con Google. */
export async function loginWithPassword(email: string, password: string): Promise<string> {
  const { access_token } = await apiFetch<{ access_token: string }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return access_token;
}

export async function registerWithPassword(
  email: string,
  password: string,
  fullName: string,
): Promise<string> {
  const { access_token } = await apiFetch<{ access_token: string }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  return access_token;
}
