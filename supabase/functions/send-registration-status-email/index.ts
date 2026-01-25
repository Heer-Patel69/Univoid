import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// Use qrcode-svg which works without canvas (Deno compatible)
import QRCode from "https://esm.sh/qrcode-svg@1.1.0";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Brevo API Configuration
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SENDER_NAME = "UniVoid";
const SENDER_EMAIL = "heerpatel1032@gmail.com";

interface StatusEmailRequest {
  registrationId: string;
  status: "approved" | "rejected";
  eventId: string;
  userId: string;
  qrCode?: string; // The generated QR code string
}

// Generate QR code as SVG string
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

// Upload QR code SVG to Supabase Storage and return public URL
async function uploadQRCodeToStorage(
  supabase: any,
  registrationId: string,
  svgContent: string
): Promise<string | null> {
  try {
    const fileName = `qr-${registrationId}.svg`;
    const filePath = fileName;
    
    // Convert SVG string to Uint8Array
    const encoder = new TextEncoder();
    const svgBytes = encoder.encode(svgContent);
    
    // Upload to storage bucket
    const { data, error } = await supabase.storage
      .from("ticket-qrcodes")
      .upload(filePath, svgBytes, {
        contentType: "image/svg+xml",
        upsert: true, // Overwrite if exists
      });
    
    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("ticket-qrcodes")
      .getPublicUrl(filePath);
    
    console.log("QR code uploaded successfully:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("QR upload error:", error);
    return null;
  }
}

// Send email via Brevo REST API
async function sendEmailViaBrevo(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_SMTP_PASSWORD not configured");
    }

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Brevo API error:", errorText);
      return { success: false, error: `Brevo API error: ${response.status} - ${errorText}` };
    }

    const result = await response.json();
    console.log("Email sent successfully via Brevo:", result);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("Brevo send error:", error);
    return { success: false, error: error.message };
  }
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Registration status email function called");

  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    // Check Brevo API key
    if (!BREVO_API_KEY) {
      console.error("CRITICAL: BREVO_SMTP_PASSWORD is missing!");
      throw new Error("Email service not configured");
    }
    console.log("Brevo API key verified ✓");

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

    // Generate and upload QR code to storage for reliable email display
    let qrCodeImageHtml = "";
    if (qrCode && isApproved) {
      try {
        console.log("Generating QR code SVG for payload:", qrCode.substring(0, 50) + "...");
        const qrSvg = generateQRCodeSVG(qrCode);
        console.log("QR code SVG generated successfully, length:", qrSvg.length);

        // Upload to storage and get public URL
        const qrImageUrl = await uploadQRCodeToStorage(supabase, registrationId, qrSvg);

        if (qrImageUrl) {
          // Use hosted URL - works in all email clients!
          qrCodeImageHtml = `
            <div style="text-align: center; margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px;">
              <p style="color: #374151; font-weight: 600; margin-bottom: 16px;">🎫 Your Entry QR Code</p>
              <img src="${qrImageUrl}" alt="Event Entry QR Code" style="width: 240px; height: 240px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
              <p style="color: #6b7280; font-size: 12px; margin-top: 12px;">Show this QR code at the entry gate</p>
            </div>
          `;
        } else {
          // Fallback to base64 if upload fails
          console.warn("Storage upload failed, falling back to base64");
          const svgBase64 = btoa(qrSvg);
          const svgDataUrl = `data:image/svg+xml;base64,${svgBase64}`;
          qrCodeImageHtml = `
            <div style="text-align: center; margin: 24px 0; padding: 20px; background: #f9fafb; border-radius: 12px;">
              <p style="color: #374151; font-weight: 600; margin-bottom: 16px;">🎫 Your Entry QR Code</p>
              <img src="${svgDataUrl}" alt="Event Entry QR Code" style="width: 240px; height: 240px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
              <p style="color: #6b7280; font-size: 12px; margin-top: 12px;">Show this QR code at the entry gate</p>
              <p style="color: #f59e0b; font-size: 11px; margin-top: 8px;">💡 If QR doesn't display, view it on the <a href="https://univoid.tech/my-tickets" style="color: #4f46e5;">My Tickets</a> page</p>
            </div>
          `;
        }
      } catch (qrError) {
        console.error("QR generation error:", qrError);
        // Don't fail the email, just skip QR with helpful message
        qrCodeImageHtml = `
          <div style="text-align: center; margin: 24px 0; padding: 20px; background: #fef3c7; border-radius: 12px;">
            <p style="color: #92400e; font-weight: 600;">🎫 Access Your QR Code</p>
            <p style="color: #78350f; font-size: 14px; margin-top: 8px;">View your entry QR code on the <a href="https://univoid.tech/my-tickets" style="color: #4f46e5; font-weight: 600;">My Tickets</a> page</p>
          </div>
        `;
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
      <div style="background: #eef2ff; padding: 16px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #6366f1;">
        <p style="margin: 0; color: #374151;">📱 <strong>Access Your Ticket:</strong> You can access your ticket on the <strong>My Tickets</strong> page. You can also view it using this link: <a href="https://univoid.tech/my-tickets" style="color: #4f46e5; font-weight: 600;">https://univoid.tech/my-tickets</a></p>
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
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">✨ UniVoid</h1>
              <p style="color: rgba(255,255,255,0.8); margin: 8px 0 0 0; font-size: 14px;">Event Registration Update</p>
            </div>
            <div style="background: ${statusColor}; padding: 16px; text-align: center;">
              <h2 style="color: white; margin: 0; font-size: 20px;">${statusEmoji} Registration ${statusText}</h2>
            </div>
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">Hi ${profile.full_name},</p>
              ${isApproved ? approvedContent : rejectedContent}
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} UniVoid. All rights reserved.
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log("Sending status email to:", profile.email);
    console.log("Email HTML length:", emailHtml.length);

    // Send email via Brevo
    const result = await sendEmailViaBrevo(
      profile.email,
      `${statusEmoji} Registration ${statusText}: ${event.title}`,
      emailHtml
    );

    if (!result.success) {
      console.error("BREVO EMAIL FAILED:", result.error);
      throw new Error(`Email delivery failed: ${result.error}`);
    }

    console.log("✅ EMAIL SENT SUCCESSFULLY via Brevo:", { messageId: result.messageId, to: profile.email });

    return new Response(JSON.stringify({
      success: true,
      messageId: result.messageId,
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
        details: "Email could not be sent. Please check Brevo dashboard for details."
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);