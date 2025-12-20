import { useState, useEffect, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { scholarshipsService, Scholarship, ScholarshipFilters, UserProfile } from "@/services/scholarshipsService";
import { useAuth } from "@/contexts/AuthContext";

export function useRealtimeScholarships(filters?: ScholarshipFilters) {
  const queryClient = useQueryClient();
  const [isRealtime, setIsRealtime] = useState(false);
  const { profile } = useAuth();

  // Build user profile for personalization
  const userProfile: UserProfile | null = profile ? {
    state: profile.state,
    degree: profile.degree,
    course_stream: profile.course_stream,
    interests: profile.interests,
  } : null;

  const queryKey = ["scholarships", filters, userProfile?.state];

  const { data: scholarships = [], isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () => scholarshipsService.getApprovedScholarships(filters, userProfile),
    staleTime: 30 * 1000,
  });

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel("scholarships-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scholarships",
        },
        (payload) => {
          console.log("Scholarship realtime update:", payload.eventType);
          setIsRealtime(true);

          if (payload.eventType === "INSERT") {
            const newScholarship = payload.new as Scholarship;
            if (newScholarship.status === "approved") {
              queryClient.setQueryData<Scholarship[]>(queryKey, (old = []) => {
                // Avoid duplicates
                if (old.some(s => s.id === newScholarship.id)) return old;
                return [newScholarship, ...old];
              });
            }
          } else if (payload.eventType === "UPDATE") {
            const updated = payload.new as Scholarship;
            queryClient.setQueryData<Scholarship[]>(queryKey, (old = []) => {
              // If status changed to approved, add to list
              if (updated.status === "approved" && updated.deadline_status === "active") {
                const exists = old.some(s => s.id === updated.id);
                if (!exists) {
                  return [updated, ...old];
                }
                return old.map(s => s.id === updated.id ? updated : s);
              }
              // If status changed from approved, remove from list
              if (updated.status !== "approved" || updated.deadline_status !== "active") {
                return old.filter(s => s.id !== updated.id);
              }
              return old.map(s => s.id === updated.id ? updated : s);
            });
          } else if (payload.eventType === "DELETE") {
            const deleted = payload.old as { id: string };
            queryClient.setQueryData<Scholarship[]>(queryKey, (old = []) => 
              old.filter(s => s.id !== deleted.id)
            );
          }

          setTimeout(() => setIsRealtime(false), 1000);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, JSON.stringify(filters)]);

  return {
    scholarships,
    isLoading,
    error,
    refetch,
    isRealtime,
  };
}

export function usePendingScholarships() {
  const queryClient = useQueryClient();

  const { data: scholarships = [], isLoading, refetch } = useQuery({
    queryKey: ["scholarships", "pending"],
    queryFn: () => scholarshipsService.getPendingScholarships(),
    staleTime: 10 * 1000,
  });

  // Real-time for pending
  useEffect(() => {
    const channel = supabase
      .channel("pending-scholarships-realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "scholarships",
          filter: "status=eq.pending",
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  const approve = useCallback(async (id: string) => {
    await scholarshipsService.approveScholarship(id);
    queryClient.invalidateQueries({ queryKey: ["scholarships"] });
  }, [queryClient]);

  const reject = useCallback(async (id: string, reason?: string) => {
    await scholarshipsService.rejectScholarship(id, reason);
    queryClient.invalidateQueries({ queryKey: ["scholarships"] });
  }, [queryClient]);

  return {
    scholarships,
    isLoading,
    refetch,
    approve,
    reject,
  };
}
