import { useEffect } from 'react';

/**
 * Hook to lock body scroll on desktop viewports
 * Prevents body from scrolling while event content is being scrolled
 */
export const useBodyScrollLock = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    // Lock body scroll
    const originalOverflow = document.body.style.overflow;
    const originalHtmlOverflow = document.documentElement.style.overflow;
    
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
      document.documentElement.style.overflow = originalHtmlOverflow;
    };
  }, [enabled]);
};

export default useBodyScrollLock;
