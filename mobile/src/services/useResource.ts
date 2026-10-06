import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "./apiClient";

export interface Resource<T> {
  data: T | null;
  loading: boolean;
  /** 428 = el usuario aun no conecto su cuenta de Google (tools_service). */
  needsGoogle: boolean;
  error: string;
  reload: () => void;
  /** Vuelve a pedir los datos sin quitar los que ya se ven (nada salta). */
  refresh: () => void;
  setData: (updater: (prev: T | null) => T | null) => void;
}

// Texto claro para el usuario; el detalle tecnico solo va a la consola.
export function friendlyError(err: unknown): string {
  if (err instanceof ApiError) {
    console.warn(`API ${err.status}: ${err.message}`);
    return "No pudimos cargar esto. Toca Reintentar.";
  }
  return "No hay conexión con el servidor. Revisa tu internet y toca Reintentar.";
}

// Carga un recurso al montar y expone reload/refresh/setData (para updates
// optimistas).
export function useResource<T>(fetcher: () => Promise<T>): Resource<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsGoogle, setNeedsGoogle] = useState(false);
  const [error, setError] = useState("");
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback((silent: boolean) => {
    if (!silent) {
      setLoading(true);
      setError("");
      setNeedsGoogle(false);
    }
    fetcherRef
      .current()
      .then((value) => {
        setDataState(value);
        setError("");
        setNeedsGoogle(false);
      })
      .catch((err) => {
        // En un refresh silencioso se conservan los datos que ya se veian.
        if (silent) return;
        setDataState(null);
        if (err instanceof ApiError && err.status === 428) setNeedsGoogle(true);
        else setError(friendlyError(err));
      })
      .finally(() => setLoading(false));
  }, []);

  const reload = useCallback(() => load(false), [load]);
  const refresh = useCallback(() => load(true), [load]);

  useEffect(reload, [reload]);

  return { data, loading, needsGoogle, error, reload, refresh, setData: setDataState };
}
