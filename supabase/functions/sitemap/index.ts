import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

const SITE_URL = "https://univoid.tech";

Deno.serve(async (req) => {
  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = {
    ...getCorsHeaders(req),
    "Content-Type": "application/xml",
  };

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch approved/published content — canonical URLs only (no query-parameter variants)
    const [materialsRes, eventsRes, projectsRes, booksRes, profilesRes] = await Promise.all([
      supabase.from("materials").select("id, updated_at").eq("status", "approved"),
      supabase.from("events").select("id, updated_at, slug").eq("status", "published"),
      supabase.from("projects").select("id, updated_at"),
      supabase.from("books").select("id, updated_at, slug").eq("status", "approved"),
      supabase.rpc("get_public_leaderboard", { limit_count: 100 }),
    ]);

    const materials = materialsRes.data || [];
    const events = eventsRes.data || [];
    const projects = projectsRes.data || [];
    const books = booksRes.data || [];
    const profiles = profilesRes.data || [];

    const today = new Date().toISOString().split("T")[0];

    // Static public pages — no auth/dashboard/private routes
    const staticPages = [
      { loc: "/", priority: "1.0", changefreq: "daily" },
      { loc: "/materials", priority: "0.9", changefreq: "daily" },
      { loc: "/events", priority: "0.9", changefreq: "daily" },
      { loc: "/projects", priority: "0.8", changefreq: "daily" },
      { loc: "/books", priority: "0.8", changefreq: "daily" },
      { loc: "/leaderboard", priority: "0.6", changefreq: "weekly" },
      { loc: "/colleges", priority: "0.7", changefreq: "weekly" },
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

    // Add individual materials (canonical path-based URLs only)
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

    // Add individual events — only those with a slug to avoid redirect chains
    for (const item of events) {
      if (!item.slug) {
        console.warn(`Event ${item.id} has no slug, skipping in sitemap`);
        continue;
      }
      const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
      xml += `
  <url>
    <loc>${SITE_URL}/events/${item.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // Add individual projects
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

    // Add individual books — only those with a slug to avoid redirect chains
    for (const item of books) {
      if (!item.slug) {
        console.warn(`Book ${item.id} has no slug, skipping in sitemap`);
        continue;
      }
      const lastmod = item.updated_at ? item.updated_at.split("T")[0] : today;
      xml += `
  <url>
    <loc>${SITE_URL}/books/${item.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    }

    // Add public profile/rank pages
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

    console.log(`Generated sitemap: ${materials.length} materials, ${events.length} events, ${projects.length} projects, ${books.length} books, ${profiles.length} profiles`);

    return new Response(xml, { headers: corsHeaders });
  } catch (error) {
    console.error("Sitemap generation error:", error);
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>`, {
      headers: corsHeaders,
      status: 500,
    });
  }
});
