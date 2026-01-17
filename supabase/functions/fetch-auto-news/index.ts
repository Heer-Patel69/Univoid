import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

const SYSTEM_USER_EMAIL = "system@univoid.local";
const SYSTEM_USER_NAME = "UniVoid System";

// INDIA-ONLY scholarship keywords (MANDATORY)
const INDIA_SEARCH_QUERIES = [
  "India scholarship",
  "Indian students scholarship",
  "state government scholarship India",
  "AICTE scholarship",
  "UGC scholarship",
  "NSP scholarship",
  "higher education scheme India",
  "merit scholarship India 2024 2025",
];

// FOREIGN/GLOBAL keywords to AUTO-REJECT
const FOREIGN_REJECT_KEYWORDS = [
  "usa", "uk", "canada", "australia", "europe", "germany", "france",
  "foreign students", "international students", "overseas", "abroad",
  "study abroad", "american", "british", "australian", "european",
  "fulbright", "chevening", "commonwealth", "rhodes"
];

// TRUSTED Indian domains (WHITELIST)
const TRUSTED_DOMAINS = [
  "gov.in", "nic.in", "ac.in", "edu.in",
  "scholarships.gov.in", "nsp.gov.in", "ugc.ac.in", "aicte-india.org"
];

// Indian states for matching
const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry", "Chandigarh"
];

// Course level keywords
const COURSE_LEVELS = {
  "UG": ["undergraduate", "bachelor", "btech", "b.tech", "bsc", "b.sc", "bba", "bcom", "b.com", "ba", "be", "ug"],
  "PG": ["postgraduate", "master", "mtech", "m.tech", "msc", "m.sc", "mba", "mcom", "m.com", "ma", "pg", "phd"],
  "Diploma": ["diploma", "polytechnic", "iti"],
};

interface NewsAPIArticle {
  title: string;
  description: string;
  source: { name: string };
  url: string;
  publishedAt: string;
}

interface ScholarshipItem {
  title: string;
  description: string;
  source_name: string;
  source_url: string;
  source_domain: string;
  deadline: string | null;
  eligible_states: string[];
  is_all_india: boolean;
  eligible_courses: string[];
  official_source: boolean;
  application_link: string | null;
}

function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return "";
  }
}

function isTrustedDomain(domain: string): boolean {
  return TRUSTED_DOMAINS.some(trusted => domain.includes(trusted));
}

function containsForeignKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return FOREIGN_REJECT_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

function extractStates(text: string): { states: string[]; isAllIndia: boolean } {
  const lowerText = text.toLowerCase();

  // Check for All India
  if (lowerText.includes("all india") || lowerText.includes("pan india") ||
    lowerText.includes("national level") || lowerText.includes("nationwide")) {
    return { states: [], isAllIndia: true };
  }

  // Extract specific states
  const foundStates: string[] = [];
  for (const state of INDIAN_STATES) {
    if (lowerText.includes(state.toLowerCase())) {
      foundStates.push(state);
    }
  }

  return { states: foundStates, isAllIndia: foundStates.length === 0 };
}

function extractCourses(text: string): string[] {
  const lowerText = text.toLowerCase();
  const courses: string[] = [];

  for (const [level, keywords] of Object.entries(COURSE_LEVELS)) {
    if (keywords.some(kw => lowerText.includes(kw))) {
      courses.push(level);
    }
  }

  return courses.length > 0 ? courses : ["Any"];
}

function extractDeadline(text: string): string | null {
  // Common deadline patterns
  const patterns = [
    /deadline[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /last date[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /apply by[:\s]+(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
    /(\d{1,2}(?:st|nd|rd|th)?\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      try {
        const date = new Date(match[1]);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0];
        }
      } catch {
        continue;
      }
    }
  }

  return null;
}

function isValidScholarship(article: NewsAPIArticle): boolean {
  const text = `${article.title} ${article.description}`.toLowerCase();

  // MUST contain scholarship-related keywords
  const scholarshipKeywords = ["scholarship", "fellowship", "grant", "stipend", "financial aid", "bursary"];
  const hasScholarshipKeyword = scholarshipKeywords.some(kw => text.includes(kw));
  if (!hasScholarshipKeyword) return false;

  // MUST NOT contain foreign keywords
  if (containsForeignKeywords(text)) {
    console.log(`Rejected (foreign): ${article.title.substring(0, 50)}...`);
    return false;
  }

  // MUST contain India-related content
  const indiaKeywords = ["india", "indian", ...INDIAN_STATES.map(s => s.toLowerCase())];
  const hasIndiaKeyword = indiaKeywords.some(kw => text.includes(kw));
  if (!hasIndiaKeyword) {
    console.log(`Rejected (no India): ${article.title.substring(0, 50)}...`);
    return false;
  }

  return true;
}

function processScholarship(article: NewsAPIArticle): ScholarshipItem {
  const text = `${article.title} ${article.description}`;
  const domain = extractDomain(article.url);
  const { states, isAllIndia } = extractStates(text);

  return {
    title: article.title,
    description: article.description || "",
    source_name: article.source?.name || "Unknown",
    source_url: article.url,
    source_domain: domain,
    deadline: extractDeadline(text),
    eligible_states: states,
    is_all_india: isAllIndia,
    eligible_courses: extractCourses(text),
    official_source: isTrustedDomain(domain),
    application_link: isTrustedDomain(domain) ? article.url : null,
  };
}

async function getOrCreateSystemUser(supabase: any): Promise<string> {
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", SYSTEM_USER_EMAIL)
    .maybeSingle();

  if (existingProfile?.id) {
    return existingProfile.id;
  }

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: SYSTEM_USER_EMAIL,
    password: crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      full_name: SYSTEM_USER_NAME,
      college_name: "UniVoid System",
      course_stream: "System",
      year_semester: "N/A",
    },
  });

  if (authError) {
    throw new Error(`Failed to create system user: ${authError.message}`);
  }

  return authData.user.id;
}

async function fetchIndiaScholarships(apiKey: string): Promise<ScholarshipItem[]> {
  const scholarships: ScholarshipItem[] = [];
  const seenTitles = new Set<string>();

  // Calculate date range (last 7 days)
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - 7);
  const fromDateStr = fromDate.toISOString().split('T')[0];

  for (const query of INDIA_SEARCH_QUERIES.slice(0, 3)) {
    try {
      // INDIA-ONLY search parameters
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&from=${fromDateStr}&sortBy=publishedAt&pageSize=10`;

      console.log(`Fetching: ${query}`);

      const response = await fetch(url, {
        headers: { "X-Api-Key": apiKey },
      });

      if (!response.ok) {
        console.error(`NewsAPI error: ${response.status}`);
        continue;
      }

      const data = await response.json();

      if (data.articles && Array.isArray(data.articles)) {
        for (const article of data.articles as NewsAPIArticle[]) {
          if (!article.title || !article.description) continue;

          // Skip duplicates
          const titleKey = article.title.toLowerCase().substring(0, 50);
          if (seenTitles.has(titleKey)) continue;

          // Validate India-only
          if (!isValidScholarship(article)) continue;

          seenTitles.add(titleKey);
          scholarships.push(processScholarship(article));
        }
      }
    } catch (error) {
      console.error(`Error fetching "${query}":`, error);
    }
  }

  console.log(`Total valid India scholarships: ${scholarships.length}`);
  return scholarships;
}

const handler = async (req: Request): Promise<Response> => {
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    console.log("Starting India-only scholarship fetch...");

    const newsApiKey = Deno.env.get("NEWS_API_KEY");
    if (!newsApiKey) {
      throw new Error("NEWS_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const systemUserId = await getOrCreateSystemUser(supabase);
    const scholarships = await fetchIndiaScholarships(newsApiKey);

    if (scholarships.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No new India scholarships found", total: 0, inserted: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    let insertedCount = 0;
    let needsReviewCount = 0;

    for (const scholarship of scholarships) {
      // Check for duplicates
      const titlePrefix = scholarship.title.substring(0, 50);
      const { data: existing } = await supabase
        .from("scholarships")
        .select("id")
        .ilike("title", `%${titlePrefix}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`Skipping duplicate: ${titlePrefix}...`);
        continue;
      }

      // Determine status
      let status = "pending";
      if (scholarship.official_source) {
        status = "approved"; // Auto-approve trusted sources
      } else if (!scholarship.deadline) {
        status = "pending"; // Needs review for deadline
      }

      const { error } = await supabase.from("scholarships").insert({
        title: scholarship.title,
        description: scholarship.description,
        source_name: scholarship.source_name,
        source_url: scholarship.source_url,
        source_domain: scholarship.source_domain,
        deadline: scholarship.deadline,
        deadline_status: scholarship.deadline ? "active" : "needs_review",
        eligible_states: scholarship.eligible_states,
        is_all_india: scholarship.is_all_india,
        eligible_courses: scholarship.eligible_courses,
        application_link: scholarship.application_link,
        official_source: scholarship.official_source,
        status,
        created_by: systemUserId,
      });

      if (error) {
        console.error(`Failed to insert: ${error.message}`);
      } else {
        insertedCount++;
        if (status === "pending") needsReviewCount++;
        console.log(`Inserted (${status}): ${scholarship.title.substring(0, 50)}...`);
      }
    }

    console.log(`Completed: ${insertedCount} inserted, ${needsReviewCount} need review`);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Fetched ${insertedCount} India-only scholarships`,
        total: scholarships.length,
        inserted: insertedCount,
        needsReview: needsReviewCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Scholarship fetch error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
