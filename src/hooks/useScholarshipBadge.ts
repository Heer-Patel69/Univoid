import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const BADGE_STORAGE_KEY = "scholarship_badge_last_seen";

export function useScholarshipBadge() {
  const [hasNewScholarships, setHasNewScholarships] = useState(false);
  const [newCount, setNewCount] = useState(0);
  const { user, profile } = useAuth();

  // Check for new scholarships
  const checkNewScholarships = useCallback(async () => {
    if (!user) {
      setHasNewScholarships(false);
      setNewCount(0);
      return;
    }

    try {
      // Get last seen timestamp
      const lastSeen = localStorage.getItem(BADGE_STORAGE_KEY);
      const lastSeenDate = lastSeen ? new Date(lastSeen) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // 7 days ago default

      // Query scholarships created after last seen
      let query = supabase
        .from("scholarships")
        .select("id, eligible_states, is_all_india, eligible_courses")
        .eq("status", "approved")
        .eq("deadline_status", "active")
        .gt("created_at", lastSeenDate.toISOString());

      const { data: scholarships, error } = await query;

      if (error) {
        console.error("Error checking scholarships:", error);
        return;
      }

      if (!scholarships || scholarships.length === 0) {
        setHasNewScholarships(false);
        setNewCount(0);
        return;
      }

      // Filter by user profile relevance
      let relevantCount = 0;
      const userState = profile?.state?.toLowerCase();
      const userDegree = profile?.degree?.toLowerCase();

      for (const s of scholarships) {
        let isRelevant = false;

        // Check state match
        if (s.is_all_india) {
          isRelevant = true;
        } else if (userState && Array.isArray(s.eligible_states)) {
          isRelevant = s.eligible_states.some(
            (state: string) => state.toLowerCase() === userState
          );
        }

        // If still not matched, check course
        if (!isRelevant && userDegree && Array.isArray(s.eligible_courses)) {
          const courseLevel = userDegree.includes("master") || userDegree.includes("pg") 
            ? "PG" 
            : userDegree.includes("diploma") 
              ? "Diploma" 
              : "UG";
          isRelevant = s.eligible_courses.includes("Any") || s.eligible_courses.includes(courseLevel);
        }

        // If no profile, show all new scholarships
        if (!profile?.state && !profile?.degree) {
          isRelevant = true;
        }

        if (isRelevant) relevantCount++;
      }

      setNewCount(relevantCount);
      setHasNewScholarships(relevantCount > 0);
    } catch (err) {
      console.error("Error in scholarship badge check:", err);
    }
  }, [user, profile?.state, profile?.degree]);

  // Mark as seen (clear badge)
  const markAsSeen = useCallback(() => {
    localStorage.setItem(BADGE_STORAGE_KEY, new Date().toISOString());
    setHasNewScholarships(false);
    setNewCount(0);
  }, []);

  // Check on mount and when profile changes
  useEffect(() => {
    checkNewScholarships();
  }, [checkNewScholarships]);

  // Subscribe to realtime updates
  useEffect(() => {
    const channel = supabase
      .channel("scholarship-badge")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "scholarships",
          filter: "status=eq.approved",
        },
        () => {
          checkNewScholarships();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [checkNewScholarships]);

  return {
    hasNewScholarships,
    newCount,
    markAsSeen,
    refresh: checkNewScholarships,
  };
}
