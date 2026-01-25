import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import QRCode from "https://esm.sh/qrcode-svg@1.1.0";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Brevo API Configuration
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SENDER_NAME = "UniVoid";
const SENDER_EMAIL = "heerpatel1032@gmail.com";

interface TicketEmailRequest {
  ticketId: string;
  registrationId: string;
  eventId: string;
  userId: string;
  qrCode: string;
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
  ticketId: string,
  svgContent: string
): Promise<string | null> {
  try {
    const fileName = `qr-${ticketId}.svg`;
    
    // Convert SVG string to Uint8Array
    const encoder = new TextEncoder();
    const svgBytes = encoder.encode(svgContent);
    
    // Upload to storage bucket
    const { error } = await supabase.storage
      .from("ticket-qrcodes")
      .upload(fileName, svgBytes, {
        contentType: "image/svg+xml",
        upsert: true,
      });
    
    if (error) {
      console.error("Storage upload error:", error);
      return null;
    }
    
    // Get the public URL
    const { data: urlData } = supabase.storage
      .from("ticket-qrcodes")
      .getPublicUrl(fileName);
    
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
      throw new Error("BREVO_API_KEY not configured");
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
      return { success: false, error: `Brevo API error: ${response.status}` };
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
  console.log("Send ticket email function called");

  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    if (!BREVO_API_KEY) {
      console.error("BREVO_API_KEY is missing!");
      throw new Error("Email service not configured");
    }

    const { ticketId, registrationId, eventId, userId, qrCode }: TicketEmailRequest = await req.json();
    console.log("Processing ticket email:", { ticketId, registrationId, eventId, userId });

    // Create Supabase client with service role
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

    // Fetch event details with organizer info
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select(`
        title, 
        start_date, 
        venue_name, 
        venue_address,
        city,
        state,
        is_paid,
        price,
        organizer_id
      `)
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      console.error("Event fetch error:", eventError);
      throw new Error("Event not found");
    }

    // Fetch organizer name
    const { data: organizer } = await supabase
      .from("organizer_profiles")
      .select("name")
      .eq("user_id", event.organizer_id)
      .single();

    const eventDate = new Date(event.start_date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Generate and upload QR code
    let qrCodeImageHtml = "";
    try {
      console.log("Generating QR code for ticket:", ticketId);
      const qrSvg = generateQRCodeSVG(qrCode);
      
      // Upload to storage for reliable email display
      const qrImageUrl = await uploadQRCodeToStorage(supabase, ticketId, qrSvg);

      if (qrImageUrl) {
        qrCodeImageHtml = `
          <div style="text-align: center; margin: 24px 0; padding: 24px; background: #ffffff; border-radius: 16px; border: 2px solid #e5e7eb;">
            <p style="color: #374151; font-weight: 700; margin-bottom: 16px; font-size: 18px;">🎫 Your Entry Pass</p>
            <img src="${qrImageUrl}" alt="Event Entry QR Code" style="width: 200px; height: 200px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.15);" />
            <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">Show this QR code at the event entrance</p>
          </div>
        `;
      } else {
        // Fallback to base64
        const svgBase64 = btoa(qrSvg);
        qrCodeImageHtml = `
          <div style="text-align: center; margin: 24px 0; padding: 24px; background: #ffffff; border-radius: 16px; border: 2px solid #e5e7eb;">
            <p style="color: #374151; font-weight: 700; margin-bottom: 16px; font-size: 18px;">🎫 Your Entry Pass</p>
            <img src="data:image/svg+xml;base64,${svgBase64}" alt="Event Entry QR Code" style="width: 200px; height: 200px; border-radius: 12px;" />
            <p style="color: #6b7280; font-size: 13px; margin-top: 16px;">Show this QR code at the event entrance</p>
            <p style="color: #f59e0b; font-size: 11px; margin-top: 8px;">💡 If QR doesn't display, view on <a href="https://univoid.tech/my-tickets" style="color: #4f46e5;">My Tickets</a></p>
          </div>
        `;
      }
    } catch (qrError) {
      console.error("QR generation error:", qrError);
      qrCodeImageHtml = `
        <div style="text-align: center; margin: 24px 0; padding: 20px; background: #fef3c7; border-radius: 12px;">
          <p style="color: #92400e; font-weight: 600;">🎫 View Your QR Code</p>
          <p style="color: #78350f; font-size: 14px; margin-top: 8px;">
            <a href="https://univoid.tech/my-tickets" style="color: #4f46e5; font-weight: 600;">Click here to view your ticket</a>
          </p>
        </div>
      `;
    }

    const locationText = event.venue_name 
      ? `${event.venue_name}${event.city ? `, ${event.city}` : ""}${event.state ? `, ${event.state}` : ""}`
      : event.city && event.state 
        ? `${event.city}, ${event.state}`
        : "Location TBA";

    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Your Event Ticket</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; margin: 0; padding: 40px 20px;">
          <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);">
            
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%); padding: 28px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">✨ UniVoid</h1>
              <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0 0; font-size: 14px;">Your ticket is ready!</p>
            </div>
            
            <!-- Success Banner -->
            <div style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 18px; text-align: center;">
              <h2 style="color: white; margin: 0; font-size: 18px; font-weight: 600;">🎉 Registration Confirmed!</h2>
            </div>
            
            <!-- Content -->
            <div style="padding: 32px;">
              <p style="color: #374151; font-size: 16px; margin-bottom: 24px;">
                Hi <strong>${profile.full_name}</strong>,<br><br>
                You're all set for <strong>${event.title}</strong>! Here's your entry pass:
              </p>
              
              ${qrCodeImageHtml}
              
              <!-- Event Details Card -->
              <div style="background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%); padding: 20px; border-radius: 12px; margin: 24px 0; border: 1px solid #e2e8f0;">
                <p style="margin: 0 0 12px 0; color: #1e293b; font-weight: 700; font-size: 16px;">📋 Event Details</p>
                <p style="margin: 0 0 10px 0; color: #475569;"><strong>📅 Event:</strong> ${event.title}</p>
                <p style="margin: 0 0 10px 0; color: #475569;"><strong>🗓️ Date:</strong> ${eventDate}</p>
                <p style="margin: 0 0 10px 0; color: #475569;"><strong>📍 Location:</strong> ${locationText}</p>
                ${organizer ? `<p style="margin: 0; color: #475569;"><strong>🎪 Organizer:</strong> ${organizer.name}</p>` : ""}
              </div>
              
              <!-- Ticket Info -->
              <div style="background: #eef2ff; padding: 16px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #6366f1;">
                <p style="margin: 0; color: #4338ca; font-size: 14px;">
                  📱 <strong>Access anytime:</strong> View your ticket on <a href="https://univoid.tech/my-tickets" style="color: #4f46e5; font-weight: 600;">My Tickets</a>
                </p>
              </div>
              
              <!-- Warning -->
              <p style="color: #dc2626; font-weight: 600; text-align: center; background: #fef2f2; padding: 12px; border-radius: 8px; margin: 20px 0;">
                ⚠️ Do NOT share this QR code with anyone!
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;">
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                © ${new Date().getFullYear()} UniVoid. All rights reserved.<br>
                <a href="https://univoid.tech" style="color: #6b7280;">univoid.tech</a>
              </p>
            </div>
          </div>
        </body>
      </html>
    `;

    console.log("Sending ticket email to:", profile.email);

    const result = await sendEmailViaBrevo(
      profile.email,
      `🎫 Your Ticket: ${event.title}`,
      emailHtml
    );

    if (!result.success) {
      console.error("Email send failed:", result.error);
      throw new Error(`Email delivery failed: ${result.error}`);
    }

    console.log("✅ Ticket email sent successfully:", { messageId: result.messageId, to: profile.email });

    return new Response(JSON.stringify({
      success: true,
      messageId: result.messageId,
      recipient: profile.email
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ ERROR in send-ticket-email:", error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);