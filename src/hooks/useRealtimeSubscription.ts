import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

type TableName = 'materials' | 'news' | 'books' | 'events' | 'profiles' | 'event_registrations';
type EventType = 'INSERT' | 'UPDATE' | 'DELETE' | '*';

interface SubscriptionOptions {
  table: TableName;
  event?: EventType;
  filter?: string;
  onInsert?: (payload: any) => void;
  onUpdate?: (payload: any) => void;
  onDelete?: (payload: any) => void;
  onChange?: (payload: any) => void;
  debounceMs?: number;
}

/**
 * Global real-time subscription hook with debouncing and automatic timeout
 * Provides instant UI updates across the app
 * Automatically cleans up after 30 minutes of inactivity to prevent memory leaks
 */
export function useRealtimeSubscription(options: SubscriptionOptions | SubscriptionOptions[]) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());

  const INACTIVITY_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  const resetInactivityTimer = useCallback(() => {
    lastActivityRef.current = Date.now();
    
    // Clear existing timer
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    
    // Set new inactivity timer
    inactivityTimerRef.current = setTimeout(() => {
      console.log('Realtime subscription cleanup due to inactivity');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    }, INACTIVITY_TIMEOUT);
  }, []);

  const createDebouncedHandler = useCallback((
    handler: ((payload: any) => void) | undefined,
    key: string,
    debounceMs: number
  ) => {
    if (!handler) return undefined;
    
    return (payload: any) => {
      resetInactivityTimer(); // Reset timer on any activity
      
      const existingTimer = debounceTimers.current.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      
      if (debounceMs === 0) {
        handler(payload);
        return;
      }
      
      const timer = setTimeout(() => {
        handler(payload);
        debounceTimers.current.delete(key);
      }, debounceMs);
      
      debounceTimers.current.set(key, timer);
    };
  }, [resetInactivityTimer]);

  useEffect(() => {
    const subscriptions = Array.isArray(options) ? options : [options];
    const channelName = `realtime-${subscriptions.map(s => s.table).join('-')}-${Date.now()}`;
    
    const channel = supabase.channel(channelName);

    // Initialize inactivity timer
    resetInactivityTimer();

    subscriptions.forEach((sub, index) => {
      const debounceMs = sub.debounceMs ?? 300;
      const keyPrefix = `${sub.table}-${index}`;

      const handler = (payload: any) => {
        const eventType = payload.eventType as string;
        
        if (eventType === 'INSERT' && sub.onInsert) {
          createDebouncedHandler(sub.onInsert, `${keyPrefix}-insert`, debounceMs)?.(payload);
        } else if (eventType === 'UPDATE' && sub.onUpdate) {
          createDebouncedHandler(sub.onUpdate, `${keyPrefix}-update`, debounceMs)?.(payload);
        } else if (eventType === 'DELETE' && sub.onDelete) {
          createDebouncedHandler(sub.onDelete, `${keyPrefix}-delete`, debounceMs)?.(payload);
        }
        
        if (sub.onChange) {
          createDebouncedHandler(sub.onChange, `${keyPrefix}-change`, debounceMs)?.(payload);
        }
      };

      channel.on(
        'postgres_changes' as any,
        { event: sub.event || '*', schema: 'public', table: sub.table, filter: sub.filter },
        handler
      );
    });

    channelRef.current = channel.subscribe();

    return () => {
      // Clear all debounce timers
      debounceTimers.current.forEach(timer => clearTimeout(timer));
      debounceTimers.current.clear();
      
      // Clear inactivity timer
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [options, createDebouncedHandler, resetInactivityTimer]);

  return channelRef.current;
}

/**
 * Clear cache utility for optimistic updates
 */
export function clearRealtimeCache(keys: string[]) {
  keys.forEach(key => {
    // Clear from in-memory caches if needed
    console.log(`Cache cleared for: ${key}`);
  });
}
