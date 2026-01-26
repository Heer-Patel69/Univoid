import { useEffect } from 'react';

/**
 * Hook to lock body scroll on desktop viewports
 * Used for pages that need full scroll control (like BookMyShow-style event detail)
 */
export const useBodyScrollLock = (enabled: boolean = true) => {
  useEffect(() => {
    if (!enabled) return;

    const isDesktop = () => window.innerWidth >= 1024;
    
    const lockBodyScroll = () => {
      if (isDesktop()) {
        // Save current scroll position
        const scrollY = window.scrollY;
        
        // Lock both body and html
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.left = '0';
        document.body.style.right = '0';
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';
      }
    };

    const unlockBodyScroll = () => {
      // Get scroll position from body top
      const scrollY = document.body.style.top;
      
      // Restore styles
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
      
      // Restore scroll position
      if (scrollY) {
        window.scrollTo(0, parseInt(scrollY || '0') * -1);
      }
    };

    const handleResize = () => {
      if (isDesktop()) {
        lockBodyScroll();
      } else {
        unlockBodyScroll();
      }
    };

    // Initial lock
    lockBodyScroll();
    window.addEventListener('resize', handleResize);

    return () => {
      unlockBodyScroll();
      window.removeEventListener('resize', handleResize);
    };
  }, [enabled]);
};

export default useBodyScrollLock;
