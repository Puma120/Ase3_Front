// Cliente de back/proactive_service via el gateway (/proactive/*). Contratos
// espejados de back/proactive_service/app/schemas/proactive.py.

import { apiFetch } from "./apiClient";

export interface AppNotification {
  id: string;
  kind: string;
  title: string;
  body: string;
  read: boolean;
  created_at: string;
}

export const heartbeat = () => apiFetch<void>("/proactive/heartbeat", { method: "POST" });

export const putLocation = (lat: number, lng: number, accuracy?: number | null) =>
  apiFetch<void>("/proactive/location", {
    method: "PUT",
    body: JSON.stringify({ lat, lng, accuracy: accuracy ?? null }),
  });

// `sound`: el aviso llega por el canal con sonido o por el silencioso.
export const registerDevice = (token: string, platform: "android" | "ios" | "web", sound = false) =>
  apiFetch<void>("/proactive/devices", {
    method: "POST",
    body: JSON.stringify({ token, platform, sound }),
  });

export const unregisterDevice = (token: string) =>
  apiFetch<void>("/proactive/devices", { method: "DELETE", body: JSON.stringify({ token }) });

export const listNotifications = () => apiFetch<AppNotification[]>("/proactive/notifications?limit=15");

export const markAllRead = () =>
  apiFetch<void>("/proactive/notifications/read", { method: "POST", body: JSON.stringify({}) });
