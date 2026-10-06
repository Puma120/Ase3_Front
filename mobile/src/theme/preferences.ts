// Preferencias de apariencia elegidas por el usuario en Ajustes > Apariencia
// (decision 10 del documento de diseno TDAH: tema y tamano de letra
// ajustables, con el diseno por defecto ya legible). Viven solo en este
// dispositivo (localStore) y se exponen como store reactivo, igual que
// services/session.ts.
import { useSyncExternalStore } from "react";

import { getJSON, setJSON } from "../services/localStore";

export type ThemePref = "system" | "light" | "dark";
export type TextSizePref = "normal" | "large" | "xlarge";

export interface Preferences {
  theme: ThemePref;
  textSize: TextSizePref;
  /** Companero ilustrado (decorativo). Opcional: quien lo prefiere sobrio lo apaga. */
  mascot: boolean;
}

export const TEXT_SCALE: Record<TextSizePref, number> = {
  normal: 1,
  large: 1.15,
  xlarge: 1.3,
};

const STORAGE_KEY = "ase3_prefs";
const DEFAULTS: Preferences = { theme: "system", textSize: "normal", mascot: true };

let prefs: Preferences = { ...DEFAULTS, ...getJSON<Partial<Preferences>>(STORAGE_KEY, {}) };
const listeners = new Set<() => void>();

export function getPreferences(): Preferences {
  return prefs;
}

export function setPreferences(patch: Partial<Preferences>): void {
  prefs = { ...prefs, ...patch };
  setJSON(STORAGE_KEY, prefs);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function usePreferences(): Preferences {
  return useSyncExternalStore(subscribe, getPreferences, getPreferences);
}
