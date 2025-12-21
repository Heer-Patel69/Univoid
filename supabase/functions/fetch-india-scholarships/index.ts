import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Curated India-only scholarships (reliable data source)
// Updated for 2025-26 academic year
const INDIA_SCHOLARSHIPS = [
  {
    title: "National Scholarship Portal (NSP) - Central Sector Scheme",
    description: "Central Sector Scheme of Scholarships for College and University students. For students whose parental income is not more than Rs. 4.5 Lakh per annum.",
    source_name: "National Scholarship Portal",
    source_url: "https://scholarships.gov.in",
    source_domain: "scholarships.gov.in",
    deadline: "2025-12-31",
    eligible_states: [],
    is_all_india: true,
    eligible_courses: ["UG", "PG"],
    official_source: true,
    application_link: "https://scholarships.gov.in",
  },
  {
    title: "Prime Minister's Scholarship Scheme (PMSS)",
    description: "For wards of Ex-Servicemen/Ex-Coast Guard personnel. Scholarship amount ranges from Rs. 3000 to Rs. 5000 per month for technical/professional courses.",
    source_name: "Kendriya Sainik Board",
    source_url: "https://ksb.gov.in",
    source_domain: "ksb.gov.in",
    deadline: "2025-12-31",
    eligible_states: [],
    is_all_india: true,
    eligible_courses: ["UG", "PG", "Diploma"],
    official_source: true,
    application_link: "https://ksb.gov.in/pmss.htm",
  },
  {
    title: "AICTE Pragati Scholarship for Girls",
    description: "For girl students studying in AICTE approved technical institutions. Scholarship amount of Rs. 50,000 per annum.",
    source_name: "AICTE",
    source_url: "https://www.aicte-india.org",
    source_domain: "aicte-india.org",
    deadline: "2025-12-31",
    eligible_states: [],
    is_all_india: true,
    eligible_courses: ["UG", "Diploma"],
    official_source: true,
    application_link: "https://www.aicte-india.org/schemes/students-development-schemes/Pragati-Scholarship-Scheme-for-Girls",
  },
  {
    title: "AICTE Saksham Scholarship for Specially-Abled Students",
    description: "For specially-abled students pursuing technical education. Scholarship of Rs. 50,000 per annum.",
    source_name: "AICTE",
    source_url: "https://www.aicte-india.org",
    source_domain: "aicte-india.org",
    deadline: "2025-12-31",
    eligible_states: [],
    is_all_india: true,
    eligible_courses: ["UG", "Diploma"],
    official_source: true,
    application_link: "https://www.aicte-india.org/schemes/students-development-schemes/Saksham-Scholarship-Scheme",
  },
  {
    title: "UGC Post Graduate Merit Scholarship for University Rank Holders",
    description: "For university rank holders pursuing postgraduate studies. Monthly scholarship of Rs. 3100.",
    source_name: "UGC",
    source_url: "https://www.ugc.ac.in",
    source_domain: "ugc.ac.in",
    deadline: "2025-12-31",
    eligible_states: [],
    is_all_india: true,
    eligible_courses: ["PG"],
    official_source: true,
    application_link: "https://www.ugc.ac.in/Scholarships/",
  },
  {
    title: "Vidyasiri Scholarship - Karnataka",
    description: "For SC/ST/OBC students of Karnataka pursuing higher education. Covers tuition fees and provides maintenance allowance.",
    source_name: "Karnataka State Government",
    source_url: "https://sw.kar.nic.in",
    source_domain: "sw.kar.nic.in",
    deadline: "2025-12-31",
    eligible_states: ["Karnataka"],
    is_all_india: false,
    eligible_courses: ["UG", "PG", "Diploma"],
    official_source: true,
    application_link: "https://sw.kar.nic.in",
  },
  {
    title: "e-Kalyan Scholarship - Jharkhand",
    description: "Pre-Matric and Post-Matric scholarship for SC/ST/BC students of Jharkhand.",
    source_name: "Jharkhand Government",
    source_url: "https://ekalyan.cgg.gov.in",
    source_domain: "ekalyan.cgg.gov.in",
    deadline: "2025-12-31",
    eligible_states: ["Jharkhand"],
    is_all_india: false,
    eligible_courses: ["UG", "PG", "Diploma"],
    official_source: true,
    application_link: "https://ekalyan.cgg.gov.in",
  },
  {
    title: "Maharashtra State Scholarship - Rajarshi Chhatrapati Shahu Maharaj Merit Scholarship",
    description: "For meritorious students from Maharashtra pursuing professional courses.",
    source_name: "Maharashtra Government",
    source_url: "https://mahadbt.maharashtra.gov.in",
    source_domain: "mahadbt.maharashtra.gov.in",
    deadline: "2025-12-31",
    eligible_states: ["Maharashtra"],
    is_all_india: false,
    eligible_courses: ["UG", "PG"],
    official_source: true,
    application_link: "https://mahadbt.maharashtra.gov.in",
  },
  {
    title: "West Bengal Aikyashree Scholarship",
    description: "For minority community students of West Bengal pursuing Class 9 to PhD level education.",
    source_name: "West Bengal Government",
    source_url: "https://wbmdfc.org",
    source_domain: "wbmdfc.org",
    deadline: "2025-12-31",
    eligible_states: ["West Bengal"],
    is_all_india: false,
    eligible_courses: ["UG", "PG", "Diploma"],
    official_source: true,
    application_link: "https://wbmdfc.org",
  },
  {
    title: "Tamil Nadu BC/MBC Scholarship",
    description: "Post-Matric scholarship for Backward Classes and Most Backward Classes students of Tamil Nadu.",
    source_name: "Tamil Nadu Government",
    source_url: "https://bcmbcmw.tn.gov.in",
    source_domain: "bcmbcmw.tn.gov.in",
    deadline: "2025-12-31",
    eligible_states: ["Tamil Nadu"],
    is_all_india: false,
    eligible_courses: ["UG", "PG", "Diploma"],
    official_source: true,
    application_link: "https://bcmbcmw.tn.gov.in",
  },
  {
    title: "Telangana TS ePass Scholarship",
    description: "Post-Matric scholarship for SC/ST/BC/EBC/Disabled/Minority students of Telangana.",
    source_name: "Telangana Government",
    source_url: "https://telanganaepass.cgg.gov.in",
    source_domain: "telanganaepass.cgg.gov.in",
    deadline: "2025-12-31",
    eligible_states: ["Telangana"],
    is_all_india: false,
    eligible_courses: ["UG", "PG", "Diploma"],
    official_source: true,
    application_link: "https://telanganaepass.cgg.gov.in",
  },
  {
    title: "Uttar Pradesh Post Matric Scholarship",
    description: "For SC/ST/OBC students of Uttar Pradesh pursuing higher education.",
    source_name: "Uttar Pradesh Government",
    source_url: "https://scholarship.up.gov.in",
    source_domain: "scholarship.up.gov.in",
    deadline: "2025-12-31",
    eligible_states: ["Uttar Pradesh"],
    is_all_india: false,
    eligible_courses: ["UG", "PG", "Diploma"],
    official_source: true,
    application_link: "https://scholarship.up.gov.in",
  },
  {
    title: "Rajasthan Mukhyamantri Uchh Shiksha Chhatravriti Yojana",
    description: "For students who secured above 60% in Class 12 from state government schools. Rs. 5000 per annum.",
    source_name: "Rajasthan Government",
    source_url: "https://hte.rajasthan.gov.in",
    source_domain: "hte.rajasthan.gov.in",
    deadline: "2025-12-31",
    eligible_states: ["Rajasthan"],
    is_all_india: false,
    eligible_courses: ["UG"],
    official_source: true,
    application_link: "https://hte.rajasthan.gov.in",
  },
  {
    title: "Gujarat MYSY Scholarship (Mukhyamantri Yuva Swavalamban Yojana)",
    description: "For students pursuing diploma, graduation, or postgraduation courses. Up to Rs. 2 lakh per year for professional courses.",
    source_name: "Gujarat Government",
    source_url: "https://mysy.guj.nic.in",
    source_domain: "mysy.guj.nic.in",
    deadline: "2025-12-31",
    eligible_states: ["Gujarat"],
    is_all_india: false,
    eligible_courses: ["UG", "PG", "Diploma"],
    official_source: true,
    application_link: "https://mysy.guj.nic.in",
  },
  {
    title: "Inspire Scholarship for Higher Education (SHE)",
    description: "By Department of Science & Technology for students pursuing natural and basic sciences. Rs. 80,000 per annum.",
    source_name: "DST India",
    source_url: "https://online-inspire.gov.in",
    source_domain: "online-inspire.gov.in",
    deadline: "2025-12-31",
    eligible_states: [],
    is_all_india: true,
    eligible_courses: ["UG"],
    official_source: true,
    application_link: "https://online-inspire.gov.in",
  },
];

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting India-only scholarship sync...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    let insertedCount = 0;
    let updatedCount = 0;

    for (const scholarship of INDIA_SCHOLARSHIPS) {
      // Check for existing by title prefix
      const titlePrefix = scholarship.title.substring(0, 40);
      const { data: existing } = await supabase
        .from("scholarships")
        .select("id, deadline, deadline_status")
        .ilike("title", `%${titlePrefix}%`)
        .limit(1);

      if (existing && existing.length > 0) {
        // UPDATE existing scholarship with fresh data
        const { error: updateError } = await supabase
          .from("scholarships")
          .update({
            description: scholarship.description,
            source_url: scholarship.source_url,
            application_link: scholarship.application_link,
            deadline: scholarship.deadline,
            deadline_status: "active",
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing[0].id);

        if (updateError) {
          console.error(`Failed to update ${scholarship.title}: ${updateError.message}`);
        } else {
          updatedCount++;
          console.log(`Updated: ${scholarship.title.substring(0, 50)}...`);
        }
        continue;
      }

      // Insert new scholarship
      const { error } = await supabase.from("scholarships").insert({
        title: scholarship.title,
        description: scholarship.description,
        source_name: scholarship.source_name,
        source_url: scholarship.source_url,
        source_domain: scholarship.source_domain,
        deadline: scholarship.deadline,
        deadline_status: "active",
        eligible_states: scholarship.eligible_states,
        is_all_india: scholarship.is_all_india,
        eligible_courses: scholarship.eligible_courses,
        application_link: scholarship.application_link,
        official_source: scholarship.official_source,
        status: "approved", // Auto-approve verified government sources
      });

      if (error) {
        console.error(`Failed to insert: ${error.message}`);
      } else {
        insertedCount++;
        console.log(`Inserted: ${scholarship.title.substring(0, 50)}...`);
      }
    }

    // Also run auto-expire on old scholarships
    await supabase.rpc("auto_expire_scholarships");

    console.log(`Completed: ${insertedCount} inserted, ${updatedCount} updated`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced scholarships: ${insertedCount} new, ${updatedCount} updated`,
        total: INDIA_SCHOLARSHIPS.length,
        inserted: insertedCount,
        updated: updatedCount,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Scholarship sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
