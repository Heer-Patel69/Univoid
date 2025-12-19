import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusEmailRequest {
  registrationId: string;
  status: "approved" | "rejected";
  eventId: string;
  userId: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Registration status email function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { registrationId, status, eventId, userId }: StatusEmailRequest = await req.json();
    console.log("Processing status email:", { registrationId, status, eventId, userId });

    // Create Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      console.error("Profile fetch error:", profileError);
      throw new Error("User profile not found");
    }

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title, start_date, venue_name, venue_address")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("Event fetch error:", eventError);
      throw new Error("Event not found");
    }

    const isApproved = status === "approved";
    const statusColor = isApproved ? "#22c55e" : "#ef4444";
    const statusText = isApproved ? "Approved" : "Rejected";
    const statusEmoji = isApproved ? "✅" : "❌";

    const eventDate = new Date(event.start_date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    const approvedContent = `
      <p>Great news! Your ticket is now confirmed. Here's what you need to know:</p>
      <ul style="color: #374151; margin: 16px 0;">
        <li><strong>Event:</strong> ${event.title}</li>
        <li><strong>Date:</strong> ${eventDate}</li>
        ${event.venue_name ? `<li><strong>Venue:</strong> ${event.venue_name}</li>` : ""}
        ${event.venue_address ? `<li><strong>Address:</strong> ${event.venue_address}</li>` : ""}
      </ul>
      <p>You can view your ticket and QR code in the <a href="https://univoid.in/my-tickets" style="color: #6366f1;">My Tickets</a> section of your account.</p>
    `;

    const rejectedContent = `
      <p>Unfortunately, your registration for <strong>${event.title}</strong> has been declined.</p>
      <p style="color: #6b7280; margin-top: 16px;">This could be due to incomplete payment verification or limited capacity. If you believe this is an error, please contact the event organizer.</p>
    `;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Registration ${statusText}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; margin: 0; padding: 40px 20px;">
          <div style="max-width: 500px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
            <div style="background: ${statusColor}; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">${statusEmoji} Registration ${statusText}</h1>
            </div>
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Hi ${profile.full_name},</p>
              ${isApproved ? approvedContent : rejectedContent}
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} Univoid. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log("Sending status email to:", profile.email);

    const emailResponse = await resend.emails.send({
      from: "Univoid <onboarding@resend.dev>",
      to: [profile.email],
      subject: `${statusEmoji} Registration ${statusText}: ${event.title}`,
      html: emailHtml,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-registration-status-email:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
