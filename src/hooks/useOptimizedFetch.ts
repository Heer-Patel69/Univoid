import { useState, useEffect, useRef, useCallback } from 'react';

interface UseOptimizedFetchOptions<T> {
  fetchFn: () => Promise<T>;
  defaultValue: T;
  timeoutMs?: number;
  cacheKey?: string;
  cacheTtl?: number; // Custom cache TTL in milliseconds
}

interface UseOptimizedFetchResult<T> {
  data: T;
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache with configurable TTL
const cache = new Map<string, { data: unknown; timestamp: number }>();

// Cache TTL configurations for different content types
export const CACHE_TTL = {
  SHORT: 30 * 1000,          // 30 seconds - user-specific data
  MEDIUM: 2 * 60 * 1000,     // 2 minutes - frequently updated public data
  LONG: 5 * 60 * 1000,       // 5 minutes - stable public data (materials, news)
  EXTRA_LONG: 15 * 60 * 1000 // 15 minutes - rarely changing data (stats, leaderboard)
};

const DEFAULT_CACHE_TTL = CACHE_TTL.MEDIUM;

export function useOptimizedFetch<T>({
  fetchFn,
  defaultValue,
  timeoutMs = 8000,
  cacheKey,
  cacheTtl = DEFAULT_CACHE_TTL,
}: UseOptimizedFetchOptions<T>): UseOptimizedFetchResult<T> {
  const [data, setData] = useState<T>(() => {
    // Initialize from cache if available
    if (cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTtl) {
        return cached.data as T;
      }
    }
    return defaultValue;
  });
  const [isLoading, setIsLoading] = useState(() => {
    // Don't show loading if we have valid cache
    if (cacheKey) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTtl) {
        return false;
      }
    }
    return true;
  });
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasFetchedRef = useRef(false);

  // Store fetchFn in ref to avoid dependency issues
  const fetchFnRef = useRef(fetchFn);
  fetchFnRef.current = fetchFn;

  const fetchData = useCallback(async (skipCache = false) => {
    // Check cache first (unless skipping)
    if (cacheKey && !skipCache) {
      const cached = cache.get(cacheKey);
      if (cached && Date.now() - cached.timestamp < cacheTtl) {
        if (isMounted.current) {
          setData(cached.data as T);
          setIsLoading(false);
        }
        return;
      }
    }

    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    if (isMounted.current) {
      setIsLoading(true);
    }

    try {
      // Create timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
      });

      const result = await Promise.race([fetchFnRef.current(), timeoutPromise]);

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
        console.error('Fetch error:', err);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [cacheKey, cacheTtl, timeoutMs]);

  useEffect(() => {
    isMounted.current = true;
    hasFetchedRef.current = false;

    // Always fetch on mount
    fetchData();
    hasFetchedRef.current = true;

    // Safety timeout - always stop loading after timeout + buffer
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }, timeoutMs + 2000);

    return () => {
      isMounted.current = false;
      clearTimeout(safetyTimeout);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchData, timeoutMs]);

  const refetch = useCallback(async () => {
    // Clear cache on refetch
    if (cacheKey) {
      cache.delete(cacheKey);
    }
    await fetchData(true);
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
