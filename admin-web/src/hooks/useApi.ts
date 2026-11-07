import { useCallback, useEffect, useEffectEvent, useState } from 'react';

import { errorMessage } from '../api/client';

interface ApiState<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  /** Relance le chargement (après une modification, par exemple). */
  reload(): void;
}

interface Result<T> {
  /** Ressource chargée (`key`) et requête précise (`key` + rechargement). */
  key: string;
  request: string;
  data: T | null;
  error: string | null;
}

/**
 * Charge une ressource à l'affichage et à chaque changement de `key`
 * (sérialisation des filtres/pagination). Annule la requête précédente
 * pour qu'une réponse lente n'écrase pas une plus récente. Pendant un
 * rechargement de la même ressource, les données précédentes restent affichées.
 */
export function useApi<T>(load: (signal: AbortSignal) => Promise<T>, key: string): ApiState<T> {
  const [tick, setTick] = useState(0);
  const [result, setResult] = useState<Result<T>>({ key: '', request: '', data: null, error: null });
  const request = `${key}#${tick}`;
  const run = useEffectEvent(load);

  useEffect(() => {
    const controller = new AbortController();
    run(controller.signal)
      .then((data) => setResult({ key, request, data, error: null }))
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setResult((prev) => ({
          key,
          request,
          data: prev.key === key ? prev.data : null,
          error: errorMessage(err),
        }));
      });
    return () => controller.abort();
  }, [key, request]);

  const reload = useCallback(() => setTick((n) => n + 1), []);
  const loading = result.request !== request;
  return {
    data: result.key === key ? result.data : null,
    error: loading ? null : result.error,
    loading,
    reload,
  };
}
