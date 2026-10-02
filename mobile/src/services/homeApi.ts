// Lecturas del dashboard de Inicio (back/tools_service y back/agent_service via
// el gateway). Contratos espejados de back/tools_service/app/schemas/tools.py.

import { apiFetch } from "./apiClient";

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  all_day: boolean;
}

export interface TaskItem {
  id: string;
  title: string;
  notes: string;
  due: string | null;
}

export interface FreeSlot {
  start: string;
  end: string;
}

export interface RoutinesSummary {
  streak_days: number;
  week: { date: string; count: number }[];
  completed_week: number;
  created_week: number;
  scheduled_week: number;
}

export function getTodayEvents(): Promise<CalendarEvent[]> {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const qs = new URLSearchParams({
    window_start: start.toISOString(),
    window_end: end.toISOString(),
  });
  return apiFetch<CalendarEvent[]>(`/tools/calendar/events?${qs}`);
}

export function getPendingTasks(): Promise<TaskItem[]> {
  return apiFetch<TaskItem[]>("/tools/tasks");
}

export function completeTask(id: string): Promise<{ id: string; status: string }> {
  return apiFetch(`/tools/tasks/${encodeURIComponent(id)}/complete`, { method: "POST" });
}

export function getRoutinesSummary(): Promise<RoutinesSummary> {
  return apiFetch<RoutinesSummary>("/tools/routines/summary");
}

export function getFreeSlots(durationMinutes = 25, windowHours = 6): Promise<FreeSlot[]> {
  const start = new Date();
  const end = new Date(start.getTime() + windowHours * 3600_000);
  return apiFetch<FreeSlot[]>("/tools/calendar/free-slots", {
    method: "POST",
    body: JSON.stringify({
      window_start: start.toISOString(),
      window_end: end.toISOString(),
      duration_minutes: durationMinutes,
    }),
  });
}

export async function getSuggestion(): Promise<string | null> {
  const { suggestion } = await apiFetch<{ suggestion: string | null }>("/agent/suggestion");
  return suggestion;
}
