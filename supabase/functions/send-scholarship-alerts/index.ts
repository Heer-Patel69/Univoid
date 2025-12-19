import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ScholarshipNews {
  id: string;
  title: string;
  content: string;
  external_link: string | null;
  created_at: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  college_name: string | null;
  course_stream: string | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting personalized scholarship email notifications...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get recent scholarship news (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: scholarshipNews, error: newsError } = await supabase
      .from("news")
      .select("id, title, content, external_link, created_at")
      .eq("status", "approved")
      .eq("category", "scholarship")
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false })
      .limit(5);

    if (newsError) {
      console.error("Error fetching scholarship news:", newsError);
      throw newsError;
    }

    if (!scholarshipNews || scholarshipNews.length === 0) {
      console.log("No new scholarship news to send");
      return new Response(
        JSON.stringify({ success: true, message: "No new scholarship news", emailsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${scholarshipNews.length} scholarship news items`);

    // Get users who want scholarship alerts
    const { data: preferences, error: prefError } = await supabase
      .from("email_preferences")
      .select("user_id")
      .eq("scholarship_alerts", true);

    if (prefError) {
      console.error("Error fetching preferences:", prefError);
      throw prefError;
    }

    const userIds = preferences?.map(p => p.user_id) || [];
    
    if (userIds.length === 0) {
      console.log("No users with scholarship alerts enabled");
      return new Response(
        JSON.stringify({ success: true, message: "No users subscribed", emailsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user profiles
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, college_name, course_stream")
      .in("id", userIds)
      .eq("is_disabled", false);

    if (profileError) {
      console.error("Error fetching profiles:", profileError);
      throw profileError;
    }

    let emailsSent = 0;

    for (const profile of (profiles || []) as UserProfile[]) {
      try {
        // Build personalized email content
        const scholarshipListHtml = (scholarshipNews as ScholarshipNews[]).map(news => `
          <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #6366f1;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${news.title}</h3>
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
              ${news.content.substring(0, 200)}${news.content.length > 200 ? '...' : ''}
            </p>
            ${news.external_link ? `<a href="${news.external_link}" style="color: #6366f1; text-decoration: none; font-weight: 500; font-size: 14px;">Read more →</a>` : ''}
          </div>
        `).join('');

        const personalizedNote = profile.course_stream 
          ? `<p style="color: #6b7280; font-size: 14px;">We found these scholarships that might be relevant for <strong>${profile.course_stream}</strong> students${profile.college_name ? ` at ${profile.college_name}` : ''}.</p>`
          : '';

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1f2937; font-size: 24px; margin: 0;">🎓 Scholarship Alerts</h1>
                <p style="color: #6b7280; margin: 10px 0 0 0;">New opportunities for you</p>
              </div>
              
              <p style="color: #1f2937; font-size: 16px;">Hi ${profile.full_name || 'Student'},</p>
              
              ${personalizedNote}
              
              <h2 style="color: #1f2937; font-size: 18px; margin: 25px 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                Latest Scholarships
              </h2>
              
              ${scholarshipListHtml}
              
              <div style="margin-top: 30px; padding: 20px; background: #f3f4f6; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 15px 0; color: #4b5563;">Want to see all scholarships?</p>
                <a href="https://univoid.in/news?category=scholarship" style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                  View All Scholarships
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                You're receiving this because you enabled scholarship alerts on UniVoid.<br>
                <a href="https://univoid.in/dashboard" style="color: #6366f1;">Manage your preferences</a>
              </p>
            </div>
          </body>
          </html>
        `;

        const { error: emailError } = await resend.emails.send({
          from: "UniVoid <notifications@resend.dev>",
          to: [profile.email],
          subject: `🎓 ${scholarshipNews.length} New Scholarship${scholarshipNews.length > 1 ? 's' : ''} for You`,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Failed to send email to ${profile.email}:`, emailError);
        } else {
          emailsSent++;
          console.log(`Sent scholarship email to ${profile.email}`);
        }
      } catch (userError) {
        console.error(`Error processing user ${profile.id}:`, userError);
      }
    }

    console.log(`Completed: ${emailsSent} emails sent`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${emailsSent} scholarship alert emails`,
        scholarshipCount: scholarshipNews.length,
        emailsSent,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Scholarship email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
