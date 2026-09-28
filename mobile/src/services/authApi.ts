// Llamadas a back/auth_service via el gateway (/auth/*).
// Contratos espejados de back/auth_service/app/schemas/auth.py.

import { apiFetch } from "./apiClient";

export interface User {
  id: string;
  email: string;
  full_name: string;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
}

export async function register(
  email: string,
  full_name: string,
  password: string,
): Promise<User> {
  return apiFetch<User>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ email, full_name, password }),
  });
}

export async function login(email: string, password: string): Promise<string> {
  const { access_token } = await apiFetch<TokenResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
  return access_token;
}

export async function getMe(): Promise<User> {
  return apiFetch<User>("/auth/users/me");
}
