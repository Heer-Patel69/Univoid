import { useState, useEffect, useRef } from 'react';

interface UseSkeletonOptions {
  /** Minimum time to show skeleton in ms (prevents flash, default: 100) */
  minDisplayTime?: number;
}

/**
 * Simple hook to sync skeleton state with external loading state.
 * Applies minimum display time to prevent jarring flash.
 * 
 * @param externalLoading - The loading state from your data fetching
 * @param options - Configuration options
 * @returns Whether to show the skeleton
 */
export function useSkeletonSync(
  externalLoading: boolean,
  options: UseSkeletonOptions = {}
): boolean {
  const { minDisplayTime = 100 } = options;
  
  const [showSkeleton, setShowSkeleton] = useState(externalLoading);
  const loadingStartTime = useRef<number | null>(null);
  const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Cleanup any existing timeout
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    if (externalLoading) {
      // Start loading - show skeleton immediately
      setShowSkeleton(true);
      loadingStartTime.current = Date.now();
    } else {
      // Stop loading - ensure minimum display time
      if (loadingStartTime.current) {
        const elapsed = Date.now() - loadingStartTime.current;
        const remaining = minDisplayTime - elapsed;

        if (remaining > 0) {
          // Wait for minimum display time
          hideTimeoutRef.current = setTimeout(() => {
            setShowSkeleton(false);
            loadingStartTime.current = null;
          }, remaining);
        } else {
          // Already shown long enough
          setShowSkeleton(false);
          loadingStartTime.current = null;
        }
      } else {
        // No loading started, just hide
        setShowSkeleton(false);
      }
    }

    return () => {
      if (hideTimeoutRef.current) {
        clearTimeout(hideTimeoutRef.current);
      }
    };
  }, [externalLoading, minDisplayTime]);

  return showSkeleton;
}

/**
 * @deprecated Use useSkeletonSync instead
 */
export function useSkeleton(options: { initialLoading?: boolean; minDisplayTime?: number } = {}) {
  const { initialLoading = true, minDisplayTime = 300 } = options;
  const [isLoading, setIsLoading] = useState(initialLoading);
  
  return {
    isLoading: useSkeletonSync(isLoading, { minDisplayTime }),
    startLoading: () => setIsLoading(true),
    stopLoading: () => setIsLoading(false),
    setLoading: setIsLoading,
  };
}
