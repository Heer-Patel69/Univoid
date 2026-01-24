import { supabase } from "@/integrations/supabase/client";

export interface College {
  id: string;
  university: string;
  college_name: string;
  college_type: string | null;
  state: string;
  district: string;
  is_popular: boolean;
}

// Get all unique states - uses direct query with type bypass for new table
export async function getCollegeStates(): Promise<string[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("colleges")
      .select("state")
      .order("state");
    
    if (error) {
      console.error("Error fetching states:", error);
      return [];
    }
    
    // Get unique states
    const uniqueStates = [...new Set((data || []).map((row: any) => row.state))];
    return uniqueStates as string[];
  } catch (err) {
    console.error("Failed to fetch states:", err);
    return [];
  }
}

// Get districts for a specific state
export async function getCollegeDistricts(state: string): Promise<string[]> {
  try {
    const { data, error } = await (supabase as any)
      .from("colleges")
      .select("district")
      .eq("state", state)
      .order("district");
    
    if (error) {
      console.error("Error fetching districts:", error);
      return [];
    }
    
    // Get unique districts
    const uniqueDistricts = [...new Set((data || []).map((row: any) => row.district))];
    return uniqueDistricts as string[];
  } catch (err) {
    console.error("Failed to fetch districts:", err);
    return [];
  }
}

// Search colleges with filters
export async function searchColleges(params: {
  state?: string | null;
  district?: string | null;
  search?: string | null;
  limit?: number;
  offset?: number;
}): Promise<College[]> {
  try {
    let query = (supabase as any)
      .from("colleges")
      .select("id, university, college_name, college_type, state, district, is_popular");
    
    if (params.state) {
      query = query.eq("state", params.state);
    }
    
    if (params.district) {
      query = query.eq("district", params.district);
    }
    
    if (params.search && params.search.trim()) {
      query = query.ilike("college_name", `%${params.search}%`);
    }
    
    const { data, error } = await query
      .order("is_popular", { ascending: false })
      .order("college_name")
      .range(params.offset || 0, (params.offset || 0) + (params.limit || 50) - 1);
    
    if (error) {
      console.error("Error searching colleges:", error);
      return [];
    }
    
    return (data || []) as College[];
  } catch (err) {
    console.error("Failed to search colleges:", err);
    return [];
  }
}

// Count colleges with filters
export async function countColleges(params: {
  state?: string | null;
  district?: string | null;
  search?: string | null;
}): Promise<number> {
  try {
    let query = (supabase as any)
      .from("colleges")
      .select("id", { count: "exact", head: true });
    
    if (params.state) {
      query = query.eq("state", params.state);
    }
    
    if (params.district) {
      query = query.eq("district", params.district);
    }
    
    if (params.search && params.search.trim()) {
      query = query.ilike("college_name", `%${params.search}%`);
    }
    
    const { count, error } = await query;
    
    if (error) {
      console.error("Error counting colleges:", error);
      return 0;
    }
    
    return count || 0;
  } catch (err) {
    console.error("Failed to count colleges:", err);
    return 0;
  }
}
