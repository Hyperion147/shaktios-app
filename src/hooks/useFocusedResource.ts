import * as React from 'react';
import { useFocusEffect } from 'expo-router';
import { normalizeError } from '../api/client';
import type { ApiError } from '../types';

/** Read-only screen data: cancel on blur/key changes and ignore out-of-order retries. */
export function useFocusedResource<T>(load: (signal: AbortSignal) => Promise<T>, message: (error: ApiError) => string) {
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const request = React.useRef<AbortController | null>(null);
  const reload = React.useCallback(async () => {
    request.current?.abort();
    const controller = new AbortController();
    request.current = controller;
    setData(null);
    setError(null);
    setLoading(true);
    try {
      const result = await load(controller.signal);
      if (!controller.signal.aborted) setData(result);
    } catch (failure) {
      if (!controller.signal.aborted) setError(message(normalizeError(failure)));
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, [load, message]);
  useFocusEffect(React.useCallback(() => {
    void reload();
    return () => { request.current?.abort(); };
  }, [reload]));
  return { data, error, loading, reload };
}
