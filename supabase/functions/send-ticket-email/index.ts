import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
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

// Generate QR code PNG using external API and upload to storage
async function generateAndUploadQRCode(
  supabase: any,
  ticketId: string,
  qrData: string
): Promise<string | null> {
  try {
    // Use Google Charts API to generate QR code as PNG
    // This is a reliable, free service that returns actual PNG images
    const qrApiUrl = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodeURIComponent(qrData)}&choe=UTF-8&chld=M|4`;
    
    console.log("Fetching QR PNG from Google Charts API...");
    const response = await fetch(qrApiUrl);
    
    if (!response.ok) {
      console.error("QR API error:", response.status);
      return null;
    }
    
    const pngBuffer = await response.arrayBuffer();
    const pngBytes = new Uint8Array(pngBuffer);
    
    console.log("QR PNG fetched, size:", pngBytes.length, "bytes");
    
    // Upload PNG to storage
    const fileName = `qr-${ticketId}.png`;
    
    const { error } = await supabase.storage
      .from("ticket-qrcodes")
      .upload(fileName, pngBytes, {
        contentType: "image/png",
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
    
    console.log("QR PNG uploaded successfully:", urlData.publicUrl);
    return urlData.publicUrl;
  } catch (error) {
    console.error("QR generation/upload error:", error);
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

    // Generate and upload QR code as PNG
    let qrCodeImageHtml = "";
    try {
      console.log("Generating QR code PNG for ticket:", ticketId);
      
      // Upload PNG to storage for reliable email display
      const qrImageUrl = await generateAndUploadQRCode(supabase, ticketId, qrCode);

      if (qrImageUrl) {
        qrCodeImageHtml = `
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background: #FFFDF5; border: 3px solid #1a1a1a; border-radius: 24px; padding: 28px 32px; box-shadow: 6px 6px 0 #1a1a1a;">
              <p style="color: #1a1a1a; font-weight: 800; margin: 0 0 20px 0; font-size: 20px; letter-spacing: -0.5px;">🎟️ Your Entry Pass</p>
              <div style="background: white; border: 2px solid #e5e7eb; border-radius: 16px; padding: 16px; display: inline-block;">
                <img src="${qrImageUrl}" alt="Event Entry QR Code" width="180" height="180" style="display: block; border-radius: 8px;" />
              </div>
              <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0 0; font-weight: 500;">Show this at the venue entrance</p>
            </div>
          </div>
        `;
      } else {
        // Fallback: Direct link to view ticket
        qrCodeImageHtml = `
          <div style="text-align: center; margin: 28px 0;">
            <div style="display: inline-block; background: #FFFDF5; border: 3px solid #1a1a1a; border-radius: 24px; padding: 28px 32px; box-shadow: 6px 6px 0 #1a1a1a;">
              <p style="color: #1a1a1a; font-weight: 800; margin: 0 0 16px 0; font-size: 20px;">🎟️ Your Entry Pass</p>
              <a href="https://univoid.tech/my-tickets" style="display: inline-block; background: #1a1a1a; color: white; padding: 16px 32px; border-radius: 50px; text-decoration: none; font-weight: 700; font-size: 16px;">View QR Ticket →</a>
              <p style="color: #6b7280; font-size: 13px; margin: 16px 0 0 0;">Click to view your QR code</p>
            </div>
          </div>
        `;
      }
    } catch (qrError) {
      console.error("QR generation error:", qrError);
      qrCodeImageHtml = `
        <div style="text-align: center; margin: 24px 0; padding: 24px; background: #FEF3C7; border: 2px solid #F59E0B; border-radius: 16px;">
          <p style="color: #92400E; font-weight: 700; margin: 0 0 12px 0;">🎟️ View Your Entry Pass</p>
          <a href="https://univoid.tech/my-tickets" style="color: #1a1a1a; font-weight: 700; text-decoration: underline;">Click here to view your ticket</a>
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
          <title>Your Event Ticket - UniVoid</title>
        </head>
        <body style="font-family: 'Nunito', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #FFFDF5; margin: 0; padding: 40px 16px;">
          <div style="max-width: 500px; margin: 0 auto;">
            
            <!-- Logo Header -->
            <div style="text-align: center; margin-bottom: 24px;">
              <div style="display: inline-block; background: #1a1a1a; padding: 16px 32px; border-radius: 50px; box-shadow: 4px 4px 0 #c9b99a;">
                <span style="color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">✨ UniVoid</span>
              </div>
            </div>
            
            <!-- Main Card -->
            <div style="background: #ffffff; border: 3px solid #1a1a1a; border-radius: 28px; overflow: hidden; box-shadow: 8px 8px 0 #1a1a1a;">
              
              <!-- Success Banner -->
              <div style="background: linear-gradient(135deg, #86EFAC 0%, #4ADE80 100%); padding: 24px; text-align: center; border-bottom: 3px solid #1a1a1a;">
                <h1 style="color: #166534; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px;">
                  🎉 Registration Confirmed!
                </h1>
              </div>
              
              <!-- Content -->
              <div style="padding: 32px 28px;">
                <p style="color: #374151; font-size: 17px; line-height: 1.6; margin: 0 0 8px 0;">
                  Hi <strong style="color: #1a1a1a;">${profile.full_name}</strong>,
                </p>
                <p style="color: #374151; font-size: 17px; line-height: 1.6; margin: 0 0 24px 0;">
                  You're all set for <strong style="color: #1a1a1a;">${event.title}</strong>! Here's your entry pass:
                </p>
                
                ${qrCodeImageHtml}
                
                <!-- Event Details Card -->
                <div style="background: #F3E8FF; border: 2px solid #C084FC; border-radius: 20px; padding: 24px; margin: 28px 0;">
                  <p style="margin: 0 0 16px 0; color: #7C3AED; font-weight: 800; font-size: 17px; letter-spacing: -0.3px;">
                    📋 Event Details
                  </p>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 8px 0; color: #374151; font-size: 15px; vertical-align: top; width: 40px;">🎪</td>
                      <td style="padding: 8px 0; color: #374151; font-size: 15px;"><strong>Event:</strong> ${event.title}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #374151; font-size: 15px; vertical-align: top;">📅</td>
                      <td style="padding: 8px 0; color: #374151; font-size: 15px;"><strong>Date:</strong> ${eventDate}</td>
                    </tr>
                    <tr>
                      <td style="padding: 8px 0; color: #374151; font-size: 15px; vertical-align: top;">📍</td>
                      <td style="padding: 8px 0; color: #374151; font-size: 15px;"><strong>Location:</strong> ${locationText}</td>
                    </tr>
                    ${organizer ? `
                    <tr>
                      <td style="padding: 8px 0; color: #374151; font-size: 15px; vertical-align: top;">🎭</td>
                      <td style="padding: 8px 0; color: #374151; font-size: 15px;"><strong>Organizer:</strong> ${organizer.name}</td>
                    </tr>
                    ` : ""}
                  </table>
                </div>
                
                <!-- Quick Access Pill -->
                <div style="background: #DBEAFE; border: 2px solid #60A5FA; border-radius: 16px; padding: 16px 20px; margin: 20px 0; text-align: center;">
                  <p style="margin: 0; color: #1E40AF; font-size: 14px; font-weight: 600;">
                    📱 Access anytime at <a href="https://univoid.tech/my-tickets" style="color: #1a1a1a; font-weight: 800; text-decoration: underline;">univoid.tech/my-tickets</a>
                  </p>
                </div>
                
                <!-- Warning -->
                <div style="background: #FEE2E2; border: 2px solid #F87171; border-radius: 16px; padding: 16px; margin: 24px 0; text-align: center;">
                  <p style="color: #991B1B; font-weight: 700; margin: 0; font-size: 14px;">
                    ⚠️ Keep this QR code private — do not share it!
                  </p>
                </div>
              </div>
              
              <!-- Footer -->
              <div style="background: #F9FAFB; padding: 24px; text-align: center; border-top: 2px solid #E5E7EB;">
                <p style="color: #6B7280; font-size: 12px; margin: 0 0 8px 0;">
                  Need help? Contact us at <a href="mailto:support@univoid.tech" style="color: #1a1a1a; font-weight: 600;">support@univoid.tech</a>
                </p>
                <p style="color: #9CA3AF; font-size: 11px; margin: 0;">
                  © ${new Date().getFullYear()} UniVoid · Where students learn, share & grow
                </p>
              </div>
            </div>
            
            <!-- Bottom Tagline -->
            <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 24px;">
              <a href="https://univoid.tech" style="color: #6B7280; text-decoration: none; font-weight: 600;">univoid.tech</a> · Made with 💜 for students
            </p>
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