import { useGlobalRealtimeNotifications } from '@/hooks/useGlobalRealtimeNotifications';

/**
 * Provider component that enables global real-time notifications
 * Place this inside AuthProvider to have access to user context
 */
export function GlobalRealtimeProvider({ children }: { children: React.ReactNode }) {
  // Enable global real-time notifications
  useGlobalRealtimeNotifications();
  
  return <>{children}</>;
}
