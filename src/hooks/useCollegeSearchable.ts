import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CollegeItem {
  id: string;
  name: string;
  university?: string;
  college_type?: string;
  district?: string;
}

interface UseCollegeSearchableOptions {
  stateFilter?: string | null;
  districtFilter?: string | null;
  debounceMs?: number;
  limit?: number;
}

// Fetch colleges from the colleges table
async function fetchColleges(
  searchTerm: string | null,
  stateFilter?: string | null,
  districtFilter?: string | null,
  limit: number = 20,
  popularOnly: boolean = false
): Promise<CollegeItem[]> {
  try {
    let query = supabase
      .from("colleges")
      .select("id, college_name, university, college_type, district, is_popular");

    // State filter is required
    if (stateFilter) {
      query = query.ilike("state", stateFilter);
    }

    // District filter (optional)
    if (districtFilter) {
      query = query.ilike("district", districtFilter);
    }

    if (popularOnly) {
      query = query.eq("is_popular", true);
    } else if (searchTerm && searchTerm.trim()) {
      // Case-insensitive partial match on college_name
      query = query.ilike("college_name", `%${searchTerm}%`);
    }

    const { data, error } = await query
      .order("is_popular", { ascending: false, nullsFirst: false })
      .order("college_name")
      .limit(limit);

    if (error) {
      console.error("Fetch colleges error:", error);
      return [];
    }

    return (data || []).map((item) => ({
      id: item.id,
      name: item.college_name,
      university: item.university,
      college_type: item.college_type,
      district: item.district,
    }));
  } catch (err) {
    console.error("Fetch colleges error:", err);
    return [];
  }
}

// Fetch unique states from colleges table
export async function fetchCollegeStates(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("colleges")
      .select("state")
      .order("state");

    if (error) {
      console.error("Fetch states error:", error);
      return [];
    }

    // Get unique states
    const uniqueStates = [...new Set((data || []).map((item) => item.state))].filter(Boolean) as string[];
    return uniqueStates.sort();
  } catch (err) {
    console.error("Fetch states error:", err);
    return [];
  }
}

// Fetch unique districts for a given state
export async function fetchCollegeDistricts(state: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("colleges")
      .select("district")
      .ilike("state", state)
      .order("district");

    if (error) {
      console.error("Fetch districts error:", error);
      return [];
    }

    // Get unique districts
    const uniqueDistricts = [...new Set((data || []).map((item) => item.district))].filter(Boolean) as string[];
    return uniqueDistricts.sort();
  } catch (err) {
    console.error("Fetch districts error:", err);
    return [];
  }
}

export function useCollegeSearchable({
  stateFilter,
  districtFilter,
  debounceMs = 300,
  limit = 20,
}: UseCollegeSearchableOptions) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<CollegeItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [popularItems, setPopularItems] = useState<CollegeItem[]>([]);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch popular items when state filter changes
  useEffect(() => {
    if (!stateFilter) {
      setPopularItems([]);
      setResults([]);
      return;
    }

    const fetchPopular = async () => {
      const data = await fetchColleges(
        null,
        stateFilter,
        districtFilter,
        10,
        true
      );
      setPopularItems(data);
    };

    fetchPopular();
  }, [stateFilter, districtFilter]);

  // Debounced search function
  const search = useCallback(
    async (term: string) => {
      // Clear previous timeout
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }

      // State filter is required
      if (!stateFilter) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      // If empty search, show popular items
      if (!term.trim()) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // Debounce the API call
      debounceRef.current = setTimeout(async () => {
        const data = await fetchColleges(
          term,
          stateFilter,
          districtFilter,
          limit,
          false
        );
        setResults(data);
        setIsLoading(false);
      }, debounceMs);
    },
    [stateFilter, districtFilter, debounceMs, limit]
  );

  // Trigger search when searchTerm changes
  useEffect(() => {
    search(searchTerm);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [searchTerm, search]);

  // Reset when state filter changes
  useEffect(() => {
    setSearchTerm("");
    setResults([]);
  }, [stateFilter]);

  return {
    searchTerm,
    setSearchTerm,
    results: searchTerm.trim() ? results : popularItems,
    isLoading,
    hasSearched: searchTerm.trim().length > 0,
    hasStateFilter: !!stateFilter,
  };
}
