// Llamadas a back/auth_service via el gateway (/auth/*).
// Contratos espejados de back/auth_service/app/schemas/auth.py.

import { apiFetch } from "./apiClient";

export interface User {
  id: string;
  email: string;
  full_name: string;
}

export async function getMe(): Promise<User> {
  return apiFetch<User>("/auth/users/me");
}
