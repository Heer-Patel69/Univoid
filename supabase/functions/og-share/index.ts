import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE_URL = "https://univoid.tech";
const FALLBACK_IMAGE = `${SITE_URL}/images/univoid-og.jpg`;
const SITE_NAME = "UniVoid";

interface OGData {
  title: string;
  description: string;
  image: string;
  url: string;
  type: string;
}

function generateHTML(og: OGData): string {
  const escapedTitle = og.title.replace(/"/g, '&quot;').replace(/</g, '&lt;');
  const escapedDescription = og.description.replace(/"/g, '&quot;').replace(/</g, '&lt;');
  
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  
  <!-- Primary Meta Tags -->
  <title>${escapedTitle} | ${SITE_NAME}</title>
  <meta name="title" content="${escapedTitle} | ${SITE_NAME}">
  <meta name="description" content="${escapedDescription}">
  
  <!-- Open Graph / Facebook -->
  <meta property="og:type" content="${og.type}">
  <meta property="og:url" content="${og.url}">
  <meta property="og:title" content="${escapedTitle}">
  <meta property="og:description" content="${escapedDescription}">
  <meta property="og:image" content="${og.image}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:site_name" content="${SITE_NAME}">
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:url" content="${og.url}">
  <meta name="twitter:title" content="${escapedTitle}">
  <meta name="twitter:description" content="${escapedDescription}">
  <meta name="twitter:image" content="${og.image}">
  <meta name="twitter:site" content="@UniVoid">
  
  <!-- Canonical & Redirect -->
  <link rel="canonical" href="${og.url}">
  <meta http-equiv="refresh" content="0;url=${og.url}">
  
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
      color: white;
      text-align: center;
    }
    .container { padding: 2rem; }
    h1 { font-size: 1.5rem; margin-bottom: 1rem; }
    p { opacity: 0.8; }
    a { color: #60a5fa; text-decoration: none; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Redirecting to ${SITE_NAME}...</h1>
    <p>If you are not redirected, <a href="${og.url}">click here</a>.</p>
  </div>
  <script>window.location.href = "${og.url}";</script>
</body>
</html>`;
}

function formatDate(dateStr: string): string {
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-IN', { 
      day: 'numeric', 
      month: 'short', 
      year: 'numeric' 
    });
  } catch {
    return '';
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    // Expected format: /og-share?type=events&id=xxx OR /og-share/events/xxx
    let contentType = url.searchParams.get('type') || pathParts[1];
    let contentId = url.searchParams.get('id') || pathParts[2];

    if (!contentType || !contentId) {
      // Redirect to homepage if no valid params
      return new Response(generateHTML({
        title: "UniVoid - Student Community Platform",
        description: "Join UniVoid for events, study materials, books exchange, project collaboration and more!",
        image: FALLBACK_IMAGE,
        url: SITE_URL,
        type: "website"
      }), {
        headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" }
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    let ogData: OGData;

    switch (contentType) {
      case 'events':
      case 'event': {
        const { data: event } = await supabase
          .from('events')
          .select('title, description, flyer_url, start_date, venue_name, price, is_paid, status')
          .eq('id', contentId)
          .eq('status', 'published')
          .single();

        if (!event) {
          ogData = {
            title: "Event Not Found",
            description: "This event may have been removed or is no longer available.",
            image: FALLBACK_IMAGE,
            url: `${SITE_URL}/events`,
            type: "website"
          };
        } else {
          const dateStr = formatDate(event.start_date);
          const location = event.venue_name || 'Online';
          const priceStr = event.is_paid ? `₹${event.price}` : 'Free';
          
          ogData = {
            title: event.title,
            description: `${dateStr} • ${location} • ${priceStr}${event.description ? ' — ' + event.description.substring(0, 100) : ''}`,
            image: event.flyer_url || FALLBACK_IMAGE,
            url: `${SITE_URL}/events/${contentId}`,
            type: "event"
          };
        }
        break;
      }

      case 'materials':
      case 'material': {
        const { data: material } = await supabase
          .from('materials')
          .select('title, description, subject, course, branch, college, thumbnail_url, status')
          .eq('id', contentId)
          .eq('status', 'approved')
          .single();

        if (!material) {
          ogData = {
            title: "Material Not Found",
            description: "This study material may have been removed or is pending approval.",
            image: FALLBACK_IMAGE,
            url: `${SITE_URL}/materials`,
            type: "website"
          };
        } else {
          const parts = [material.subject, material.course, material.branch].filter(Boolean);
          const metaStr = parts.join(' • ');
          
          ogData = {
            title: material.title,
            description: `${metaStr}${material.description ? ' — ' + material.description.substring(0, 100) : ''}`,
            image: material.thumbnail_url || FALLBACK_IMAGE,
            url: `${SITE_URL}/materials/${contentId}`,
            type: "article"
          };
        }
        break;
      }

      case 'books':
      case 'book': {
        const { data: book } = await supabase
          .from('books')
          .select('title, description, price, condition, listing_type, image_urls, is_sold, status')
          .eq('id', contentId)
          .eq('status', 'approved')
          .single();

        if (!book) {
          ogData = {
            title: "Book Not Found",
            description: "This book listing may have been removed or is pending approval.",
            image: FALLBACK_IMAGE,
            url: `${SITE_URL}/books`,
            type: "website"
          };
        } else {
          const listingLabels: Record<string, string> = {
            sell: 'For Sale',
            exchange: 'For Exchange',
            rent: 'For Rent',
            donate: 'Free Donation'
          };
          const listingStr = listingLabels[book.listing_type || 'sell'] || 'For Sale';
          const priceStr = book.price ? `₹${book.price}` : 'Free';
          const conditionStr = book.condition || '';
          const statusStr = book.is_sold ? ' [SOLD]' : '';
          
          ogData = {
            title: `${book.title}${statusStr}`,
            description: `${listingStr} • ${priceStr} • ${conditionStr}${book.description ? ' — ' + book.description.substring(0, 80) : ''}`,
            image: book.image_urls?.[0] || FALLBACK_IMAGE,
            url: `${SITE_URL}/books/${contentId}`,
            type: "product"
          };
        }
        break;
      }

      case 'projects':
      case 'project': {
        const { data: project } = await supabase
          .from('projects')
          .select('title, description, skills_required, max_members, is_open')
          .eq('id', contentId)
          .single();

        if (!project) {
          ogData = {
            title: "Project Not Found",
            description: "This project may have been removed.",
            image: FALLBACK_IMAGE,
            url: `${SITE_URL}/projects`,
            type: "website"
          };
        } else {
          const skills = project.skills_required?.slice(0, 3).join(', ') || 'Various skills';
          const teamStr = project.max_members ? `Team of ${project.max_members}` : 'Open team';
          const statusStr = project.is_open ? '🟢 Open for collaboration' : '🔴 Closed';
          
          ogData = {
            title: project.title,
            description: `${statusStr} • ${teamStr} • Skills: ${skills}${project.description ? ' — ' + project.description.substring(0, 80) : ''}`,
            image: FALLBACK_IMAGE,
            url: `${SITE_URL}/projects/${contentId}`,
            type: "website"
          };
        }
        break;
      }

      case 'tasks':
      case 'task': {
        const { data: task } = await supabase
          .from('task_requests')
          .select('title, description, task_type, budget, deadline, is_negotiable, status')
          .eq('id', contentId)
          .single();

        if (!task) {
          ogData = {
            title: "Task Not Found",
            description: "This task may have been removed or completed.",
            image: FALLBACK_IMAGE,
            url: `${SITE_URL}/tasks`,
            type: "website"
          };
        } else {
          const budgetStr = task.budget ? `₹${task.budget}${task.is_negotiable ? ' (Negotiable)' : ''}` : 'Budget flexible';
          const deadlineStr = task.deadline ? `Due: ${formatDate(task.deadline)}` : '';
          const typeStr = task.task_type?.replace('_', ' ') || 'Task';
          
          ogData = {
            title: task.title,
            description: `${typeStr} • ${budgetStr}${deadlineStr ? ' • ' + deadlineStr : ''}${task.description ? ' — ' + task.description.substring(0, 80) : ''}`,
            image: FALLBACK_IMAGE,
            url: `${SITE_URL}/tasks/${contentId}`,
            type: "website"
          };
        }
        break;
      }

      case 'news': {
        const { data: newsItem } = await supabase
          .from('news')
          .select('title, content, category, image_urls, status')
          .eq('id', contentId)
          .eq('status', 'approved')
          .single();

        if (!newsItem) {
          ogData = {
            title: "News Not Found",
            description: "This news article may have been removed.",
            image: FALLBACK_IMAGE,
            url: `${SITE_URL}/news`,
            type: "website"
          };
        } else {
          ogData = {
            title: newsItem.title,
            description: `${newsItem.category || 'Campus News'} — ${newsItem.content?.substring(0, 120) || ''}`,
            image: newsItem.image_urls?.[0] || FALLBACK_IMAGE,
            url: `${SITE_URL}/news/${contentId}`,
            type: "article"
          };
        }
        break;
      }

      default:
        ogData = {
          title: "UniVoid - Student Community Platform",
          description: "Join UniVoid for events, study materials, books exchange, project collaboration and more!",
          image: FALLBACK_IMAGE,
          url: SITE_URL,
          type: "website"
        };
    }

    const html = generateHTML(ogData);

    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      }
    });

  } catch (error) {
    console.error("OG Share Error:", error);
    
    const fallbackHtml = generateHTML({
      title: "UniVoid - Student Community Platform",
      description: "Join UniVoid for events, study materials, books exchange, project collaboration and more!",
      image: FALLBACK_IMAGE,
      url: SITE_URL,
      type: "website"
    });

    return new Response(fallbackHtml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
      }
    });
  }
});
