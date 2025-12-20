import { supabase } from "@/integrations/supabase/client";

export interface Scholarship {
  id: string;
  title: string;
  description: string | null;
  source_name: string;
  source_url: string | null;
  source_domain: string | null;
  deadline: string | null;
  deadline_status: string;
  eligible_states: string[];
  is_all_india: boolean;
  eligible_courses: string[];
  eligible_categories: string[];
  application_link: string | null;
  official_source: boolean;
  status: string;
  created_at: string;
}

export interface ScholarshipFilters {
  state?: string;
  course?: string;
  search?: string;
}

export const scholarshipsService = {
  async getApprovedScholarships(filters?: ScholarshipFilters): Promise<Scholarship[]> {
    let query = supabase
      .from("scholarships")
      .select("*")
      .eq("status", "approved")
      .eq("deadline_status", "active")
      .order("created_at", { ascending: false });

    if (filters?.search) {
      query = query.ilike("title", `%${filters.search}%`);
    }

    const { data, error } = await query;
    
    if (error) throw error;

    // Client-side filtering for state/course (array matching)
    let scholarships = (data || []) as unknown as Scholarship[];

    if (filters?.state) {
      scholarships = scholarships.filter(s => 
        s.is_all_india || s.eligible_states.some(st => 
          st.toLowerCase() === filters.state?.toLowerCase()
        )
      );
    }

    if (filters?.course) {
      scholarships = scholarships.filter(s => 
        s.eligible_courses.includes("Any") || 
        s.eligible_courses.includes(filters.course!)
      );
    }

    return scholarships;
  },

  async getScholarshipById(id: string): Promise<Scholarship | null> {
    const { data, error } = await supabase
      .from("scholarships")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }

    return data as unknown as Scholarship;
  },

  async getPendingScholarships(): Promise<Scholarship[]> {
    const { data, error } = await supabase
      .from("scholarships")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as Scholarship[];
  },

  async approveScholarship(id: string): Promise<void> {
    const { error } = await supabase
      .from("scholarships")
      .update({ 
        status: "approved", 
        reviewed_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (error) throw error;
  },

  async rejectScholarship(id: string, reason?: string): Promise<void> {
    const { error } = await supabase
      .from("scholarships")
      .update({ 
        status: "rejected", 
        rejection_reason: reason,
        reviewed_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (error) throw error;
  },
};
