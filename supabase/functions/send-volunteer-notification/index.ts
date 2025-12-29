import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface VolunteerNotificationRequest {
  type: "application_received" | "approved" | "rejected";
  assignmentId?: string;
  roleId: string;
  userId: string;
  organizerEmail?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, roleId, userId, organizerEmail }: VolunteerNotificationRequest = await req.json();

    // Fetch role details
    const { data: role, error: roleError } = await supabase
      .from("volunteer_roles")
      .select(`
        title,
        description,
        perks,
        event:events(title, organizer_id)
      `)
      .eq("id", roleId)
      .single();

    if (roleError || !role) {
      throw new Error("Role not found");
    }

    // Fetch user profile
    const { data: userProfile, error: userError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    if (userError || !userProfile) {
      throw new Error("User not found");
    }

    // deno-lint-ignore no-explicit-any
    const eventData = role.event as any;
    const eventTitle = eventData?.title || "Event";
    const organizerId = eventData?.organizer_id;

    let emailResponse;

    if (type === "application_received") {
      // Notify organizer about new application
      let targetEmail = organizerEmail;
      
      if (!targetEmail && organizerId) {
        const { data: organizerProfile } = await supabase
          .from("profiles")
          .select("email")
          .eq("id", organizerId)
          .single();
        targetEmail = organizerProfile?.email;
      }

      if (targetEmail) {
        emailResponse = await resend.emails.send({
          from: "Univoid <notifications@univoid.in>",
          to: [targetEmail],
          subject: `New Volunteer Application - ${role.title}`,
          html: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <div style="background: linear-gradient(135deg, #7c3aed, #6366f1); padding: 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 24px;">🙋 New Volunteer Application</h1>
                </div>
                <div style="padding: 30px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    Someone has applied to volunteer for your event!
                  </p>
                  
                  <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
                    <p style="margin: 0 0 10px 0;"><strong>Event:</strong> ${eventTitle}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Role:</strong> ${role.title}</p>
                    <p style="margin: 0 0 10px 0;"><strong>Applicant:</strong> ${userProfile.full_name}</p>
                    <p style="margin: 0;"><strong>Email:</strong> ${userProfile.email}</p>
                  </div>

                  <p style="color: #666; font-size: 14px;">
                    Visit your Organizer Dashboard to review and approve/reject this application.
                  </p>

                  <a href="https://univoid.in/organizer" 
                     style="display: inline-block; background: #7c3aed; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px;">
                    Review Application
                  </a>
                </div>
                <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    © ${new Date().getFullYear()} Univoid. All rights reserved.
                  </p>
                </div>
              </div>
            </body>
            </html>
          `,
        });
      }
    } else if (type === "approved") {
      // Notify volunteer they've been approved
      emailResponse = await resend.emails.send({
        from: "Univoid <notifications@univoid.in>",
        to: [userProfile.email],
        subject: `🎉 You're approved as a volunteer - ${eventTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">✅ You're In!</h1>
              </div>
              <div style="padding: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Hi ${userProfile.full_name},
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Great news! Your volunteer application has been <strong style="color: #22c55e;">approved</strong>!
                </p>
                
                <div style="background: #f0fdf4; border: 1px solid #22c55e; border-radius: 8px; padding: 20px; margin: 20px 0;">
                  <p style="margin: 0 0 10px 0;"><strong>Event:</strong> ${eventTitle}</p>
                  <p style="margin: 0 0 10px 0;"><strong>Your Role:</strong> ${role.title}</p>
                  ${role.description ? `<p style="margin: 0 0 10px 0;"><strong>Description:</strong> ${role.description}</p>` : ""}
                  ${role.perks ? `<p style="margin: 0;"><strong>🎁 Perks:</strong> ${role.perks}</p>` : ""}
                </div>

                <p style="color: #666; font-size: 14px;">
                  The organizer will reach out with more details about your responsibilities. 
                  Thank you for volunteering!
                </p>

                <a href="https://univoid.in/dashboard" 
                   style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px;">
                  View My Dashboard
                </a>
              </div>
              <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Univoid. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      // Create notification in database
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "volunteer",
        title: "Volunteer Application Approved! 🎉",
        message: `You've been approved as a volunteer for "${role.title}" at ${eventTitle}.`,
        link: "/dashboard",
      });

    } else if (type === "rejected") {
      // Notify volunteer they've been rejected
      emailResponse = await resend.emails.send({
        from: "Univoid <notifications@univoid.in>",
        to: [userProfile.email],
        subject: `Volunteer Application Update - ${eventTitle}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
            <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
              <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 30px; text-align: center;">
                <h1 style="color: white; margin: 0; font-size: 24px;">Application Update</h1>
              </div>
              <div style="padding: 30px;">
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Hi ${userProfile.full_name},
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Thank you for your interest in volunteering for <strong>${eventTitle}</strong>.
                </p>
                <p style="color: #333; font-size: 16px; line-height: 1.6;">
                  Unfortunately, we were unable to accept your application for the <strong>${role.title}</strong> role at this time. 
                  This could be due to limited slots or specific requirements for this position.
                </p>
                
                <p style="color: #666; font-size: 14px; margin-top: 20px;">
                  We encourage you to explore other volunteer opportunities on Univoid. 
                  There are many ways to get involved!
                </p>

                <a href="https://univoid.in/events" 
                   style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; margin-top: 15px;">
                  Browse Events
                </a>
              </div>
              <div style="background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #eee;">
                <p style="color: #999; font-size: 12px; margin: 0;">
                  © ${new Date().getFullYear()} Univoid. All rights reserved.
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      // Create notification in database
      await supabase.from("notifications").insert({
        user_id: userId,
        type: "volunteer",
        title: "Volunteer Application Update",
        message: `Your application for "${role.title}" at ${eventTitle} was not accepted.`,
        link: "/events",
      });
    }

    console.log("Volunteer notification sent:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error) {
    console.error("Error sending volunteer notification:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
