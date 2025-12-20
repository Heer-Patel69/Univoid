import { Link, LinkProps } from "react-router-dom";
import { useCallback, memo } from "react";

// Map routes to their lazy import functions
const routePreloaders: Record<string, () => Promise<unknown>> = {
  "/": () => import("@/pages/Index"),
  "/dashboard": () => import("@/pages/Dashboard"),
  "/materials": () => import("@/pages/Materials"),
  "/events": () => import("@/pages/Events"),
  "/scholarships": () => import("@/pages/Scholarships"),
  "/projects": () => import("@/pages/Projects"),
  "/tasks": () => import("@/pages/Tasks"),
  "/books": () => import("@/pages/Books"),
  "/news": () => import("@/pages/News"),
  "/leaderboard": () => import("@/pages/Leaderboard"),
  "/profile": () => import("@/pages/Profile"),
  "/settings": () => import("@/pages/Settings"),
  "/my-events": () => import("@/pages/MyTickets"),
  "/upload-material": () => import("@/pages/UploadMaterial"),
  "/sell-book": () => import("@/pages/ListBook"),
  "/projects/create": () => import("@/pages/CreateProject"),
  "/tasks/create": () => import("@/pages/CreateTask"),
  "/become-organizer": () => import("@/pages/BecomeOrganizer"),
  "/contact": () => import("@/pages/Contact"),
};

// Track what's already been preloaded
const preloadedRoutes = new Set<string>();

/**
 * PrefetchLink - Link component that preloads the destination page on hover
 * Provides instant navigation feel by loading the page before click
 */
export const PrefetchLink = memo(function PrefetchLink({
  to,
  children,
  onMouseEnter,
  onFocus,
  ...props
}: LinkProps) {
  const prefetch = useCallback(() => {
    const path = typeof to === "string" ? to : to.pathname || "";
    
    // Extract base path (without params)
    const basePath = path.split("/").slice(0, 2).join("/") || path;
    
    // Check if we have a preloader and haven't already loaded
    if (routePreloaders[basePath] && !preloadedRoutes.has(basePath)) {
      preloadedRoutes.add(basePath);
      // Use requestIdleCallback for non-blocking preload
      if ("requestIdleCallback" in window) {
        (window as any).requestIdleCallback(() => {
          routePreloaders[basePath]?.();
        });
      } else {
        routePreloaders[basePath]?.();
      }
    }
  }, [to]);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      prefetch();
      onMouseEnter?.(e);
    },
    [prefetch, onMouseEnter]
  );

  const handleFocus = useCallback(
    (e: React.FocusEvent<HTMLAnchorElement>) => {
      prefetch();
      onFocus?.(e);
    },
    [prefetch, onFocus]
  );

  return (
    <Link
      to={to}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      {...props}
    >
      {children}
    </Link>
  );
});

export default PrefetchLink;
