import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Use qrcode-svg which works without canvas (Deno compatible)
import QRCode from "https://esm.sh/qrcode-svg@1.1.0";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

interface StatusEmailRequest {
  registrationId: string;
  status: "approved" | "rejected";
  eventId: string;
  userId: string;
  qrCode?: string; // The generated QR code string
}

// Generate QR code as base64 PNG using SVG conversion
function generateQRCodeSVG(data: string): string {
  try {
    const qr = new QRCode({
      content: data,
      padding: 4,
      width: 240,
      height: 240,
      color: "#000000",
      background: "#ffffff",
      ecl: "M",
    });
    return qr.svg();
  } catch (error) {
    console.error("QR SVG generation error:", error);
    throw error;
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Registration status email function called");

  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // CRITICAL: Check API key at runtime
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("CRITICAL: RESEND_API_KEY is missing at runtime!");
      throw new Error("RESEND_API_KEY not configured");
    }
    const resend = new Resend(resendApiKey);
    console.log("Resend API key verified ✓");

    const { registrationId, status, eventId, userId, qrCode }: StatusEmailRequest = await req.json();
    console.log("Processing status email:", { registrationId, status, eventId, userId, hasQR: !!qrCode });

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

    // Generate QR code as inline SVG (no canvas needed - Deno compatible!)
    let qrCodeImageHtml = "";
    if (qrCode && isApproved) {
      try {
        console.log("Generating QR code SVG for payload:", qrCode.substring(0, 50) + "...");
        const qrSvg = generateQRCodeSVG(qrCode);
        console.log("QR code SVG generated successfully, length:", qrSvg.length);

        // Convert SVG to base64 for email embedding
        const svgBase64 = btoa(qrSvg);
        const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;

        qrCodeImageHtml = `
          <div style="text-align: center; margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px;">
            <p style="color: #374151; font-weight: 600; margin-bottom: 16px;">🎫 Your Entry QR Code</p>
            <img src="${svgDataUrl}" alt="Event Entry QR Code" style="width: 240px; height: 240px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
            <p style="color: #6b7280; font-size: 12px; margin-top: 12px;">Show this QR code at the entry gate</p>
          </div>
        `;
      } catch (qrError) {
        console.error("QR generation error:", qrError);
        // Don't fail the email, just skip QR
        qrCodeImageHtml = `<p style="color: #ef4444; text-align: center;">QR code could not be generated. Please contact support.</p>`;
      }
    }

    const approvedContent = `
      <p>Great news! Your registration has been approved. Here's your entry pass:</p>
      ${qrCodeImageHtml}
      <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 8px 0; color: #374151;"><strong>📅 Event:</strong> ${event.title}</p>
        <p style="margin: 0 0 8px 0; color: #374151;"><strong>🗓️ Date:</strong> ${eventDate}</p>
        ${event.venue_name ? `<p style="margin: 0 0 8px 0; color: #374151;"><strong>📍 Venue:</strong> ${event.venue_name}</p>` : ""}
        ${event.venue_address ? `<p style="margin: 0; color: #374151;"><strong>🏠 Address:</strong> ${event.venue_address}</p>` : ""}
      </div>
      <p style="color: #dc2626; font-weight: 600; text-align: center;">⚠️ Do NOT share this QR code with anyone!</p>
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
    console.log("Email HTML length:", emailHtml.length);

    // CRITICAL: Send email and CHECK for actual errors
    const { data, error: emailError } = await resend.emails.send({
      from: "Univoid <onboarding@resend.dev>",
      to: [profile.email],
      subject: `${statusEmoji} Registration ${statusText}: ${event.title}`,
      html: emailHtml,
    });

    // FORCE ERROR CHECK - No silent failures!
    if (emailError) {
      console.error("RESEND EMAIL FAILED:", JSON.stringify(emailError, null, 2));
      throw new Error(`Email delivery failed: ${emailError.message || JSON.stringify(emailError)}`);
    }

    if (!data || !data.id) {
      console.error("RESEND NO DATA RETURNED:", data);
      throw new Error("Email sent but no confirmation received");
    }

    console.log("✅ EMAIL SENT SUCCESSFULLY:", { emailId: data.id, to: profile.email });

    return new Response(JSON.stringify({
      success: true,
      emailId: data.id,
      recipient: profile.email
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ ERROR in send-registration-status-email:", error.message);
    console.error("Full error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        details: "Email could not be sent. Please check Resend dashboard for details."
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
