import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_USER_EMAIL = "system@univoid.local";
const SYSTEM_USER_NAME = "UniVoid System";

// Keywords for filtering student/job/placement news
const SEARCH_QUERIES = [
  "college internship",
  "campus placement",
  "fresher jobs India",
  "student career",
  "engineering jobs",
];

interface NewsAPIArticle {
  title: string;
  description: string;
  source: { name: string };
  url: string;
  publishedAt: string;
}

interface NewsItem {
  title: string;
  description: string;
  source: string;
  url: string;
  category: "Student" | "Job" | "Placement" | "Trend";
  publishedAt: string;
}

function categorizeNews(title: string, description: string): NewsItem["category"] {
  const text = `${title} ${description}`.toLowerCase();
  
  if (text.includes("placement") || text.includes("campus") || text.includes("recruit")) {
    return "Placement";
  }
  if (text.includes("job") || text.includes("hiring") || text.includes("career") || text.includes("internship")) {
    return "Job";
  }
  if (text.includes("trend") || text.includes("salary") || text.includes("skill") || text.includes("demand")) {
    return "Trend";
  }
  return "Student";
}

function generateSummary(description: string): string {
  if (!description) return "";
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.slice(0, 3).join(". ").trim() + ".";
}

async function getOrCreateSystemUser(supabase: any): Promise<string> {
  // Check if system user already exists by email
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", SYSTEM_USER_EMAIL)
    .maybeSingle();

  if (existingProfile?.id) {
    console.log(`Using existing system user: ${existingProfile.id}`);
    return existingProfile.id;
  }

  // Create new system user via admin API
  console.log("Creating new system user...");
  
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: SYSTEM_USER_EMAIL,
    password: crypto.randomUUID(), // Random password - won't be used for login
    email_confirm: true,
    user_metadata: {
      full_name: SYSTEM_USER_NAME,
      college_name: "UniVoid System",
      course_stream: "System",
      year_semester: "N/A",
    },
  });

  if (authError) {
    console.error("Failed to create system user:", authError.message);
    throw new Error(`Failed to create system user: ${authError.message}`);
  }

  console.log(`Created system user: ${authData.user.id}`);
  return authData.user.id;
}

async function fetchNewsFromNewsAPI(apiKey: string): Promise<NewsItem[]> {
  const allNews: NewsItem[] = [];
  
  // Fetch news for each search query
  for (const query of SEARCH_QUERIES.slice(0, 2)) {
    try {
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=en&sortBy=publishedAt&pageSize=5`;
      
      console.log(`Fetching news for query: ${query}`);
      
      const response = await fetch(url, {
        headers: {
          "X-Api-Key": apiKey,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`NewsAPI error for "${query}": ${response.status} - ${errorText}`);
        continue;
      }

      const data = await response.json();
      
      if (data.articles && Array.isArray(data.articles)) {
        for (const article of data.articles as NewsAPIArticle[]) {
          if (!article.title || !article.description) continue;
          
          allNews.push({
            title: article.title,
            description: article.description,
            source: article.source?.name || "Unknown",
            url: article.url,
            category: categorizeNews(article.title, article.description),
            publishedAt: article.publishedAt,
          });
        }
      }
    } catch (error) {
      console.error(`Error fetching news for "${query}":`, error);
    }
  }

  console.log(`Total news items fetched: ${allNews.length}`);
  return allNews;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting auto-news fetch from NewsAPI.org...");

    const newsApiKey = Deno.env.get("NEWS_API_KEY");
    if (!newsApiKey) {
      throw new Error("NEWS_API_KEY not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get or create system user for auto-generated content
    const systemUserId = await getOrCreateSystemUser(supabase);
    console.log(`Using system user ID: ${systemUserId}`);

    // Fetch news from NewsAPI.org
    const newsItems = await fetchNewsFromNewsAPI(newsApiKey);
    
    if (newsItems.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "No news items fetched",
          total: 0,
          inserted: 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    let insertedCount = 0;

    for (const item of newsItems) {
      // Check if similar news already exists (by title similarity)
      const titlePrefix = item.title.substring(0, 50);
      const { data: existing } = await supabase
        .from("news")
        .select("id")
        .ilike("title", `%${titlePrefix}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`Skipping duplicate: ${item.title.substring(0, 50)}...`);
        continue;
      }

      // Create news entry
      const summary = generateSummary(item.description);
      const content = `${summary}\n\n**Category:** ${item.category}\n**Source:** ${item.source}\n\n*Auto-curated for students*`;

      const { error } = await supabase.from("news").insert({
        title: `[${item.category}] ${item.title}`,
        content,
        external_link: item.url,
        created_by: systemUserId,
        status: "approved",
      });

      if (error) {
        console.error(`Failed to insert news: ${error.message}`);
      } else {
        insertedCount++;
        console.log(`Inserted: ${item.title.substring(0, 50)}...`);
      }
    }

    console.log(`Completed: ${insertedCount} news items inserted`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Fetched and inserted ${insertedCount} news items from NewsAPI.org`,
        systemUserId,
        total: newsItems.length,
        inserted: insertedCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Auto-news fetch error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);