// Llamadas a back/auth_service via el gateway (/auth/users/me/settings).
// Contrato espejado de back/auth_service/app/schemas/user_settings.py.

import { apiFetch } from "./apiClient";

export interface UserSettings {
  timezone: string;
  work_start_hour: number;
  work_end_hour: number;
  proactive_suggestions_enabled: boolean;
  focus_mode_enabled: boolean;
}

export async function getSettings(): Promise<UserSettings> {
  return apiFetch<UserSettings>("/auth/users/me/settings");
}

export async function updateSettings(
  patch: Partial<UserSettings>,
): Promise<UserSettings> {
  return apiFetch<UserSettings>("/auth/users/me/settings", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
