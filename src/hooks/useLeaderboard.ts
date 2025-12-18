import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { getGlobalLeaderboard } from "@/services/leaderboardService";
import { PublicProfile } from "@/types/database";

export function useLeaderboard(limit = 50) {
  const [leaderboard, setLeaderboard] = useState<PublicProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLeaderboard = async () => {
    try {
      const data = await getGlobalLeaderboard(limit);
      setLeaderboard(data);
      setError(null);
    } catch (err) {
      setError(err as Error);
      console.error("Error fetching leaderboard:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Set up real-time subscriptions for all content tables
    const channel = supabase
      .channel("leaderboard-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "profiles" },
        () => {
          fetchLeaderboard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "materials" },
        () => {
          fetchLeaderboard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "blogs" },
        () => {
          fetchLeaderboard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "news" },
        () => {
          fetchLeaderboard();
        }
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "books" },
        () => {
          fetchLeaderboard();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [limit]);

  return { leaderboard, isLoading, error, refetch: fetchLeaderboard };
}
