import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Content-Type": "application/xml",
};

const SITE_URL = "https://univoid.tech";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch all approved content
    const [materialsRes, eventsRes, projectsRes, tasksRes, booksRes, profilesRes] = await Promise.all([
      supabase.from("materials").select("id, updated_at").eq("status", "approved"),
      supabase.from("events").select("id, updated_at").eq("status", "published"),
      supabase.from("projects").select("id, updated_at"),
      supabase.from("task_requests").select("id, updated_at"),
      supabase.from("books").select("id, updated_at").eq("status", "approved"),
      supabase.rpc("get_public_leaderboard", { limit_count: 100 }),
    ]);

    const materials = materialsRes.data || [];
    const events = eventsRes.data || [];
    const projects = projectsRes.data || [];
    const tasks = tasksRes.data || [];
    const books = booksRes.data || [];
    const profiles = profilesRes.data || [];

    const today = new Date().toISOString().split("T")[0];

    // Static pages
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/materials", priority: "0.9", changefreq: "daily" },
      { loc: "/events", priority: "0.9", changefreq: "daily" },
      { loc: "/projects", priority: "0.8", changefreq: "daily" },
      { loc: "/tasks", priority: "0.8", changefreq: "daily" },
      { loc: "/books", priority: "0.8", changefreq: "daily" },
      { loc: "/news", priority: "0.7", changefreq: "daily" },
      { loc: "/leaderboard", priority: "0.6", changefreq: "weekly" },
      { loc: "/about-us", priority: "0.6", changefreq: "monthly" },
      { loc: "/contact", priority: "0.5", changefreq: "monthly" },
      { loc: "/faq", priority: "0.5", changefreq: "monthly" },
      { loc: "/privacy-policy", priority: "0.3", changefreq: "monthly" },
      { loc: "/terms", priority: "0.3", changefreq: "monthly" },
      { loc: "/refund-policy", priority: "0.3", changefreq: "monthly" },
      { loc: "/cookie-policy", priority: "0.3", changefreq: "monthly" },
      { loc: "/legal-disclaimer", priority: "0.3", changefreq: "monthly" },
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static pages
    for (const page of staticPages) {
      xml += `
  <url>
    <loc>${SITE_URL}${page.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    }

    // Add materials
    for (const item of materials) {
      const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
      xml += `
  <url>
    <loc>${SITE_URL}/materials/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // Add events
    for (const item of events) {
      const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
      xml += `
  <url>
    <loc>${SITE_URL}/events/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // Add projects
    for (const item of projects) {
      const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
      xml += `
  <url>
    <loc>${SITE_URL}/projects/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    // Add tasks
    for (const item of tasks) {
      const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
      xml += `
  <url>
    <loc>${SITE_URL}/tasks/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    // Add books
    for (const item of books) {
      const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
      xml += `
  <url>
    <loc>${SITE_URL}/books/${item.id}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    }

    // Add profile/rank pages
    for (const profile of profiles) {
      xml += `
  <url>
    <loc>${SITE_URL}/profile/${profile.id}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`;
    }

    xml += `
</urlset>`;

    return new Response(xml, { headers: corsHeaders });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: corsHeaders,
      status: 500,
    });
  }
});
