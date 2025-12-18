import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getGlobalLeaderboard } from "@/services/leaderboardService";
import { PublicProfile } from "@/types/database";

export function useLeaderboard(limit = 50) {
  const [leaderboard, setLeaderboard] = useState<PublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMounted = useRef(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchLeaderboard = useCallback(async () => {
    try {
      // Add timeout for fetch
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 8000);

      const data = await getGlobalLeaderboard(limit);
      clearTimeout(timeoutId);
      
      if (isMounted.current) {
        setLeaderboard(data);
        setError(null);
      }
    } catch (err) {
      if (isMounted.current) {
        setError(err as Error);
        console.error("Error fetching leaderboard:", err);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  }, [limit]);

  // Debounced fetch for real-time updates
  const debouncedFetch = useCallback(() => {
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
    }
    fetchTimeoutRef.current = setTimeout(() => {
      fetchLeaderboard();
    }, 1000); // Debounce 1 second
  }, [fetchLeaderboard]);

  useEffect(() => {
    isMounted.current = true;

    // Safety timeout - show empty state after 10 seconds
    const safetyTimeout = setTimeout(() => {
      if (isMounted.current && isLoading) {
        setIsLoading(false);
      }
    }, 10000);

    fetchLeaderboard();

    // Cleanup existing channel
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    // Single channel for leaderboard updates (debounced)
    channelRef.current = supabase
      .channel("leaderboard-updates")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, debouncedFetch)
      .subscribe();

    return () => {
      isMounted.current = false;
      clearTimeout(safetyTimeout);
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [limit, fetchLeaderboard, debouncedFetch]);

  return { leaderboard, isLoading, error, refetch: fetchLeaderboard };
}
