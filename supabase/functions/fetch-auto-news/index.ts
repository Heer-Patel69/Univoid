import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Keywords for filtering student/job/placement news
const KEYWORDS = [
  "student", "college", "university", "exam", "admission",
  "job", "placement", "internship", "hiring", "recruitment",
  "fresher", "skills", "career", "salary", "employment",
  "graduate", "campus", "education", "scholarship"
];

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
  // Generate 3-4 line summary
  if (!description) return "";
  const sentences = description.split(/[.!?]+/).filter(s => s.trim().length > 0);
  return sentences.slice(0, 3).join(". ").trim() + ".";
}

async function fetchNewsFromAPI(): Promise<NewsItem[]> {
  // Using a free news API - NewsData.io free tier or similar
  // For demo, we'll create sample news that would come from real APIs
  
  const sampleNews: NewsItem[] = [
    {
      title: "Top IT Companies Begin Campus Recruitment Drive 2024",
      description: "Major IT companies have started their annual campus recruitment drives across engineering colleges. Students from computer science and IT branches are being targeted for software development roles.",
      source: "Education Today",
      url: "https://example.com/news/1",
      category: "Placement",
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Government Announces New Internship Program for Students",
      description: "A new government-backed internship program aims to provide industry experience to over 100,000 college students. The program covers multiple sectors including technology, finance, and manufacturing.",
      source: "Career India",
      url: "https://example.com/news/2",
      category: "Job",
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Skill Demand Report: AI and Data Science Lead 2024",
      description: "Latest industry reports show AI and data science skills are the most in-demand for freshers. Companies are offering premium packages for candidates with these specialized skills.",
      source: "Tech Careers",
      url: "https://example.com/news/3",
      category: "Trend",
      publishedAt: new Date().toISOString(),
    },
  ];

  return sampleNews;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting auto-news fetch...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch news from API
    const newsItems = await fetchNewsFromAPI();
    console.log(`Fetched ${newsItems.length} news items`);

    let insertedCount = 0;

    for (const item of newsItems) {
      // Check if similar news already exists (by title similarity)
      const { data: existing } = await supabase
        .from("news")
        .select("id")
        .ilike("title", `%${item.title.substring(0, 30)}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        console.log(`Skipping duplicate: ${item.title}`);
        continue;
      }

      // Create news entry
      const summary = generateSummary(item.description);
      const content = `${summary}\n\n**Category:** ${item.category}\n**Source:** ${item.source}\n\n*Auto-curated for students*`;

      const { error } = await supabase.from("news").insert({
        title: `[${item.category}] ${item.title}`,
        content,
        external_link: item.url,
        created_by: "00000000-0000-0000-0000-000000000000", // System user placeholder
        status: "approved",
      });

      if (error) {
        console.error(`Failed to insert news: ${error.message}`);
      } else {
        insertedCount++;
        console.log(`Inserted: ${item.title}`);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Fetched and inserted ${insertedCount} news items`,
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