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

export interface UserProfile {
  state?: string | null;
  degree?: string | null;
  course_stream?: string | null;
  interests?: string[] | null;
}

export const scholarshipsService = {
  async getApprovedScholarships(filters?: ScholarshipFilters, userProfile?: UserProfile | null): Promise<Scholarship[]> {
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

    let scholarships = (data || []) as unknown as Scholarship[];

    // Client-side filtering for state/course
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

    // Personalization: sort by relevance to user profile
    if (userProfile && !filters?.state && !filters?.course) {
      scholarships = this.sortByRelevance(scholarships, userProfile);
    }

    return scholarships;
  },

  // Sort scholarships by relevance to user's profile
  sortByRelevance(scholarships: Scholarship[], profile: UserProfile): Scholarship[] {
    const userState = profile.state?.toLowerCase();
    const userDegree = profile.degree?.toLowerCase();
    const userCourse = profile.course_stream;

    return [...scholarships].sort((a, b) => {
      let scoreA = 0;
      let scoreB = 0;

      // State match: +3 points
      if (userState) {
        const aMatchesState = a.eligible_states.some(s => s.toLowerCase() === userState);
        const bMatchesState = b.eligible_states.some(s => s.toLowerCase() === userState);
        if (aMatchesState) scoreA += 3;
        if (bMatchesState) scoreB += 3;
      }

      // Degree/course match: +2 points
      if (userDegree || userCourse) {
        const courseLevel = userDegree?.includes("master") || userDegree?.includes("pg") ? "PG" 
          : userDegree?.includes("diploma") ? "Diploma" : "UG";
        
        const aMatchesCourse = a.eligible_courses.includes("Any") || a.eligible_courses.includes(courseLevel);
        const bMatchesCourse = b.eligible_courses.includes("Any") || b.eligible_courses.includes(courseLevel);
        if (aMatchesCourse) scoreA += 2;
        if (bMatchesCourse) scoreB += 2;
      }

      // All India: +1 point (less specific but still relevant)
      if (a.is_all_india) scoreA += 1;
      if (b.is_all_india) scoreB += 1;

      // Official source: +1 point
      if (a.official_source) scoreA += 1;
      if (b.official_source) scoreB += 1;

      return scoreB - scoreA;
    });
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
