import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSkeletonOptions {
  /** Initial loading state (default: true) */
  initialLoading?: boolean;
  /** Minimum time to show skeleton in ms (prevents flash, default: 300) */
  minDisplayTime?: number;
  /** Delay before showing skeleton in ms (avoids flash for fast loads, default: 0) */
  showDelay?: number;
}

interface UseSkeletonReturn {
  /** Whether skeleton should be shown */
  isLoading: boolean;
  /** Start loading (show skeleton) */
  startLoading: () => void;
  /** Stop loading (hide skeleton after minDisplayTime) */
  stopLoading: () => void;
  /** Set loading state directly */
  setLoading: (loading: boolean) => void;
}

/**
 * Hook to manage skeleton loading states consistently.
 * Features:
 * - Minimum display time to prevent jarring flash
 * - Optional delay before showing skeleton for fast connections
 * - Clean API for controlling loading state
 */
export function useSkeleton(options: UseSkeletonOptions = {}): UseSkeletonReturn {
  const {
    initialLoading = true,
    minDisplayTime = 300,
    showDelay = 0,
  } = options;

  const [isLoading, setIsLoading] = useState(showDelay > 0 ? false : initialLoading);
  const loadingStartTime = useRef<number | null>(null);
  const showDelayTimeout = useRef<NodeJS.Timeout | null>(null);
  const hideTimeout = useRef<NodeJS.Timeout | null>(null);

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (showDelayTimeout.current) clearTimeout(showDelayTimeout.current);
      if (hideTimeout.current) clearTimeout(hideTimeout.current);
    };
  }, []);

  // Handle initial loading with showDelay
  useEffect(() => {
    if (initialLoading && showDelay > 0) {
      showDelayTimeout.current = setTimeout(() => {
        setIsLoading(true);
        loadingStartTime.current = Date.now();
      }, showDelay);
    } else if (initialLoading) {
      loadingStartTime.current = Date.now();
    }
  }, []);

  const startLoading = useCallback(() => {
    if (hideTimeout.current) {
      clearTimeout(hideTimeout.current);
      hideTimeout.current = null;
    }

    if (showDelay > 0) {
      showDelayTimeout.current = setTimeout(() => {
        setIsLoading(true);
        loadingStartTime.current = Date.now();
      }, showDelay);
    } else {
      setIsLoading(true);
      loadingStartTime.current = Date.now();
    }
  }, [showDelay]);

  const stopLoading = useCallback(() => {
    if (showDelayTimeout.current) {
      clearTimeout(showDelayTimeout.current);
      showDelayTimeout.current = null;
    }

    if (!loadingStartTime.current) {
      setIsLoading(false);
      return;
    }

    const elapsed = Date.now() - loadingStartTime.current;
    const remaining = minDisplayTime - elapsed;

    if (remaining > 0) {
      hideTimeout.current = setTimeout(() => {
        setIsLoading(false);
        loadingStartTime.current = null;
      }, remaining);
    } else {
      setIsLoading(false);
      loadingStartTime.current = null;
    }
  }, [minDisplayTime]);

  const setLoading = useCallback((loading: boolean) => {
    if (loading) {
      startLoading();
    } else {
      stopLoading();
    }
  }, [startLoading, stopLoading]);

  return {
    isLoading,
    startLoading,
    stopLoading,
    setLoading,
  };
}

/**
 * Hook to sync skeleton state with external loading state (e.g., from React Query).
 * Automatically applies minDisplayTime to prevent flash.
 */
export function useSkeletonSync(
  externalLoading: boolean,
  options: Omit<UseSkeletonOptions, 'initialLoading'> = {}
): boolean {
  const { isLoading, setLoading } = useSkeleton({
    ...options,
    initialLoading: externalLoading,
  });

  useEffect(() => {
    setLoading(externalLoading);
  }, [externalLoading, setLoading]);

  return isLoading;
}
