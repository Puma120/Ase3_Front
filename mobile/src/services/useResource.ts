import { useCallback, useEffect, useRef, useState } from "react";

import { ApiError } from "./apiClient";

export interface Resource<T> {
  data: T | null;
  loading: boolean;
  /** 428 = el usuario aun no conecto su cuenta de Google (tools_service). */
  needsGoogle: boolean;
  error: string;
  reload: () => void;
  setData: (updater: (prev: T | null) => T | null) => void;
}

// Carga un recurso al montar y expone reload/setData (para updates optimistas).
export function useResource<T>(fetcher: () => Promise<T>): Resource<T> {
  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsGoogle, setNeedsGoogle] = useState(false);
  const [error, setError] = useState("");
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const reload = useCallback(() => {
    setLoading(true);
    setError("");
    setNeedsGoogle(false);
    fetcherRef
      .current()
      .then(setDataState)
      .catch((err) => {
        setDataState(null);
        if (err instanceof ApiError && err.status === 428) setNeedsGoogle(true);
        else setError(err instanceof ApiError ? err.message : "No se pudo conectar con el servidor");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(reload, [reload]);

  return { data, loading, needsGoogle, error, reload, setData: setDataState };
}
