'use client';

import { useState, useEffect, useRef } from 'react';

// Lightweight, module-level in-memory cache map
const memoryCache = new Map<string, { data: any; timestamp: number }>();

interface UseClientCacheOptions<T> {
  key: string;
  fetcher: () => Promise<T>;
  ttlMs?: number; // Time-to-live in milliseconds (default 3 minutes)
  initialData?: T;
}

export function useClientCache<T>({
  key,
  fetcher,
  ttlMs = 180000,
  initialData
}: UseClientCacheOptions<T>) {
  const cachedEntry = memoryCache.get(key);
  const [data, setData] = useState<T | undefined>(() => cachedEntry ? cachedEntry.data : initialData);
  const [loading, setLoading] = useState<boolean>(() => !cachedEntry && !initialData);
  const [error, setError] = useState<any>(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const executeFetch = async () => {
      const now = Date.now();
      const currentCache = memoryCache.get(key);

      // If valid non-stale cached data exists, set data and skip full loading state
      if (currentCache && (now - currentCache.timestamp < ttlMs)) {
        setData(currentCache.data);
        setLoading(false);
        return;
      }

      // If stale cache exists, display stale data immediately while fetching in background (SWR pattern)
      if (currentCache) {
        setData(currentCache.data);
        setLoading(false);
      } else if (!data && !initialData) {
        setLoading(true);
      }

      try {
        const freshData = await fetcher();
        if (isMounted.current) {
          memoryCache.set(key, { data: freshData, timestamp: Date.now() });
          setData(freshData);
          setError(null);
        }
      } catch (err) {
        if (isMounted.current) {
          setError(err);
        }
      } finally {
        if (isMounted.current) {
          setLoading(false);
        }
      }
    };

    executeFetch();

    return () => {
      isMounted.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const mutate = (newData: T) => {
    memoryCache.set(key, { data: newData, timestamp: Date.now() });
    setData(newData);
  };

  const invalidate = () => {
    memoryCache.delete(key);
  };

  return { data, loading, error, mutate, invalidate };
}
