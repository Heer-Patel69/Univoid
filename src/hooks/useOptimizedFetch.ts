import { useState, useEffect, useRef, useCallback } from 'react';

interface UseOptimizedFetchOptions<T> {
  fetchFn: () => Promise<T>;
  defaultValue: T;
  timeoutMs?: number;
  cacheKey?: string;
}

interface UseOptimizedFetchResult<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache
const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

export function useOptimizedFetch<T>({
  fetchFn,
  defaultValue,
  timeoutMs = 8000,
  cacheKey,
}: UseOptimizedFetchOptions<T>): UseOptimizedFetchResult<T> {
  const [data, setData] = useState<T>(defaultValue);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchData = useCallback(async () => {
    // Check cache first
    if (cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
        setData(cached.data as T);
        setIsLoading(false);
        return;
      }
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      });

      const result = await Promise.race([fetchFn(), timeoutPromise]);

      if (isMounted.current) {
        setData(result);
        setError(null);
        
        // Update cache
        if (cacheKey) {
          cache.set(cacheKey, { data: result, timestamp: Date.now() });
        }
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err as Error);
        // Keep default value on error - don't leave in loading state
        console.error('Fetch error:', err);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [fetchFn, timeoutMs, cacheKey]);

  useEffect(() => {
    isMounted.current = true;

    // Safety timeout - always stop loading after timeout + buffer
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && isLoading) {
        setIsLoading(false);
      }
    }, timeoutMs + 2000);

    fetchData();

    return () => {
      isMounted.current = false;
      clearTimeout(safetyTimeout);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, timeoutMs, isLoading]);

  const refetch = useCallback(async () => {
    // Clear cache on refetch
    if (cacheKey) {
      cache.delete(cacheKey);
    }
    setIsLoading(true);
    await fetchData();
  }, [fetchData, cacheKey]);

  return { data, isLoading, error, refetch };
}

// Clear specific cache or all cache
export function clearFetchCache(key?: string) {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
