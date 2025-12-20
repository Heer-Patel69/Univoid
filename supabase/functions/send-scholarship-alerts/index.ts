import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Scholarship {
  id: string;
  title: string;
  description: string;
  deadline: string | null;
  eligible_states: string[];
  is_all_india: boolean;
  eligible_courses: string[];
  application_link: string | null;
  source_name: string;
}

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  state: string | null;
  course_stream: string | null;
  degree: string | null;
  college_name: string | null;
}

function getUserCourseLevel(profile: UserProfile): string {
  const degree = (profile.degree || profile.course_stream || "").toLowerCase();
  
  if (degree.includes("phd") || degree.includes("master") || degree.includes("m.tech") || 
      degree.includes("mba") || degree.includes("msc") || degree.includes("pg")) {
    return "PG";
  }
  if (degree.includes("diploma") || degree.includes("polytechnic") || degree.includes("iti")) {
    return "Diploma";
  }
  return "UG"; // Default to undergraduate
}

function isEligible(scholarship: Scholarship, profile: UserProfile): boolean {
  // State matching
  const stateMatch = scholarship.is_all_india || 
    (profile.state && scholarship.eligible_states.some(s => 
      s.toLowerCase() === profile.state?.toLowerCase()
    ));
  
  if (!stateMatch) return false;
  
  // Course matching (if specified)
  if (scholarship.eligible_courses.length > 0 && !scholarship.eligible_courses.includes("Any")) {
    const userLevel = getUserCourseLevel(profile);
    if (!scholarship.eligible_courses.includes(userLevel)) {
      return false;
    }
  }
  
  return true;
}

function formatDeadline(deadline: string | null): string {
  if (!deadline) return "Check official source";
  const date = new Date(deadline);
  const now = new Date();
  const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  const formatted = date.toLocaleDateString('en-IN', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
  
  if (daysLeft <= 3) {
    return `⚠️ ${formatted} (${daysLeft} days left!)`;
  } else if (daysLeft <= 7) {
    return `⏰ ${formatted} (${daysLeft} days left)`;
  }
  return formatted;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting personalized scholarship alerts...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get recent approved scholarships (last 24 hours)
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { data: scholarships, error: schError } = await supabase
      .from("scholarships")
      .select("id, title, description, deadline, eligible_states, is_all_india, eligible_courses, application_link, source_name")
      .eq("status", "approved")
      .eq("deadline_status", "active")
      .gte("created_at", oneDayAgo)
      .order("created_at", { ascending: false })
      .limit(10);

    if (schError) throw schError;

    if (!scholarships || scholarships.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No new scholarships", emailsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${scholarships.length} new scholarships`);

    // Get users who want scholarship alerts
    const { data: preferences, error: prefError } = await supabase
      .from("email_preferences")
      .select("user_id")
      .eq("scholarship_alerts", true);

    if (prefError) throw prefError;

    const userIds = preferences?.map(p => p.user_id) || [];
    
    if (userIds.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No users subscribed", emailsSent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Get user profiles with state info
    const { data: profiles, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, state, course_stream, degree, college_name")
      .in("id", userIds)
      .eq("is_disabled", false);

    if (profileError) throw profileError;

    let emailsSent = 0;
    let inAppNotifications = 0;

    for (const profile of (profiles || []) as UserProfile[]) {
      // Filter scholarships for this user
      const eligibleScholarships = (scholarships as Scholarship[]).filter(s => 
        isEligible(s, profile)
      );

      if (eligibleScholarships.length === 0) {
        console.log(`No eligible scholarships for ${profile.email}`);
        continue;
      }

      // Create in-app notification + trigger web push
      for (const scholarship of eligibleScholarships.slice(0, 3)) {
        await supabase.from("notifications").insert({
          user_id: profile.id,
          title: "🎓 New Scholarship Match!",
          message: `${scholarship.title} - ${scholarship.is_all_india ? "All India" : scholarship.eligible_states.join(", ")}`,
          type: "scholarship",
          link: `/scholarships/${scholarship.id}`,
        });
        inAppNotifications++;
      }

      // Send web push notification for the first scholarship
      const topScholarship = eligibleScholarships[0];
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        await fetch(`${supabaseUrl}/functions/v1/send-web-push`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          },
          body: JSON.stringify({
            user_ids: [profile.id],
            title: "🎓 New Scholarship Match!",
            body: `${topScholarship.title} - Apply before deadline!`,
            url: `/scholarships/${topScholarship.id}`,
          }),
        });
      } catch (pushError) {
        console.error(`Web push failed for ${profile.id}:`, pushError);
      }

      // Send email
      try {
        const scholarshipListHtml = eligibleScholarships.map(s => `
          <div style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; border-left: 4px solid #10b981;">
            <h3 style="margin: 0 0 8px 0; color: #1f2937; font-size: 16px;">${s.title}</h3>
            <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">
              📍 ${s.is_all_india ? "All India" : s.eligible_states.join(", ")}
              ${s.eligible_courses.length > 0 ? ` • 📚 ${s.eligible_courses.join(", ")}` : ""}
            </p>
            <p style="margin: 0 0 10px 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
              ${(s.description || "").substring(0, 150)}${(s.description || "").length > 150 ? '...' : ''}
            </p>
            <p style="margin: 0 0 10px 0; font-size: 14px;">
              <strong>Deadline:</strong> ${formatDeadline(s.deadline)}
            </p>
            ${s.application_link ? `<a href="${s.application_link}" style="display: inline-block; background: #10b981; color: white; padding: 8px 16px; border-radius: 4px; text-decoration: none; font-size: 14px;">Apply Now →</a>` : ''}
          </div>
        `).join('');

        const stateNote = profile.state 
          ? `<p style="color: #059669; font-size: 14px; margin-bottom: 20px;">✅ These scholarships match your profile: <strong>${profile.state}</strong> student${profile.degree ? ` pursuing ${profile.degree}` : ''}</p>`
          : '';

        const emailHtml = `
          <!DOCTYPE html>
          <html>
          <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #ffffff; padding: 20px;">
            <div style="max-width: 600px; margin: 0 auto;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #1f2937; font-size: 24px; margin: 0;">🎓 Scholarships Just For You!</h1>
                <p style="color: #6b7280; margin: 10px 0 0 0;">Personalized opportunities from India</p>
              </div>
              
              <p style="color: #1f2937; font-size: 16px;">Hi ${profile.full_name || 'Student'},</p>
              
              ${stateNote}
              
              <h2 style="color: #1f2937; font-size: 18px; margin: 25px 0 15px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">
                Your Matched Scholarships (${eligibleScholarships.length})
              </h2>
              
              ${scholarshipListHtml}
              
              <div style="margin-top: 30px; padding: 20px; background: #ecfdf5; border-radius: 8px; text-align: center;">
                <p style="margin: 0 0 15px 0; color: #065f46;">Don't miss out! Apply before deadlines.</p>
                <a href="https://univoid.in/scholarships" style="display: inline-block; background: #10b981; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
                  View All Scholarships
                </a>
              </div>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                You're receiving this because you enabled scholarship alerts on UniVoid.<br>
                <a href="https://univoid.in/dashboard" style="color: #10b981;">Manage preferences</a>
              </p>
            </div>
          </body>
          </html>
        `;

        const { error: emailError } = await resend.emails.send({
          from: "UniVoid <notifications@resend.dev>",
          to: [profile.email],
          subject: `🎓 ${eligibleScholarships.length} Scholarship${eligibleScholarships.length > 1 ? 's' : ''} Match Your Profile!`,
          html: emailHtml,
        });

        if (emailError) {
          console.error(`Failed to send to ${profile.email}:`, emailError);
        } else {
          emailsSent++;
          console.log(`Sent to ${profile.email}: ${eligibleScholarships.length} scholarships`);
        }
      } catch (userError) {
        console.error(`Error for user ${profile.id}:`, userError);
      }
    }

    console.log(`Completed: ${emailsSent} emails, ${inAppNotifications} in-app notifications`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        scholarshipCount: scholarships.length,
        emailsSent,
        inAppNotifications,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Scholarship alert error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
