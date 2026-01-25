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
    // Use QRServer API (free, reliable, no deprecation)
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&format=png&margin=10`;
    
    console.log("Fetching QR PNG from QRServer API...");
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

// Send email via Brevo REST API with improved deliverability headers
async function sendEmailViaBrevo(
  to: string,
  toName: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!BREVO_API_KEY) {
      console.error("BREVO_API_KEY is not configured!");
      throw new Error("BREVO_API_KEY not configured");
    }

    console.log("Sending email via Brevo to:", to);

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to, name: toName }],
        subject: subject,
        htmlContent: htmlContent,
        // Transactional email headers to avoid Promotions tab
        headers: {
          "X-Priority": "1",
          "X-MSMail-Priority": "High",
          "Importance": "high"
        },
        tags: ["transactional", "ticket", "confirmation"],
      }),
    });

    const responseText = await response.text();
    console.log("Brevo API response status:", response.status);
    console.log("Brevo API response body:", responseText);

    if (!response.ok) {
      console.error("Brevo API error:", responseText);
      return { success: false, error: `Brevo API error: ${response.status} - ${responseText}` };
    }

    const result = JSON.parse(responseText);
    console.log("Email sent successfully via Brevo, messageId:", result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    console.error("Brevo send error:", error.message, error.stack);
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

      // Use the actual ticket ID (UUID) as the manual entry code
      const manualEntryCode = ticketId;

      if (qrImageUrl) {
        qrCodeImageHtml = `
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
              <p style="color: #1a1a1a; font-weight: 600; margin: 0 0 16px 0; font-size: 14px;">Entry Pass</p>
              <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; display: inline-block;">
                <img src="${qrImageUrl}" alt="Entry QR Code" width="160" height="160" style="display: block;" />
              </div>
              <p style="color: #6b7280; font-size: 12px; margin: 16px 0 0 0;">Present this QR code at the venue</p>
              
              <div style="margin-top: 16px; padding-top: 12px; border-top: 1px solid #e5e7eb;">
                <p style="color: #6b7280; font-size: 11px; margin: 0 0 6px 0;">Ticket ID (backup):</p>
                <p style="color: #1a1a1a; font-size: 10px; font-weight: 600; margin: 0; font-family: monospace; word-break: break-all; background: #f3f4f6; padding: 8px; border-radius: 4px;">${manualEntryCode}</p>
              </div>
            </div>
          </div>
        `;
      } else {
        qrCodeImageHtml = `
          <div style="text-align: center; margin: 24px 0;">
            <div style="display: inline-block; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
              <p style="color: #1a1a1a; font-weight: 600; margin: 0 0 12px 0; font-size: 14px;">Entry Pass</p>
              <div style="padding: 12px; background: #f3f4f6; border-radius: 6px;">
                <p style="color: #6b7280; font-size: 11px; margin: 0 0 6px 0;">Ticket ID:</p>
                <p style="color: #1a1a1a; font-size: 10px; font-weight: 600; margin: 0; font-family: monospace; word-break: break-all;">${manualEntryCode}</p>
              </div>
              <p style="color: #6b7280; font-size: 12px; margin: 12px 0 0 0;">Present this ID at the venue</p>
            </div>
          </div>
        `;
      }
    } catch (qrError) {
      console.error("QR generation error:", qrError);
      qrCodeImageHtml = `
        <div style="text-align: center; margin: 24px 0; padding: 20px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
          <p style="color: #1a1a1a; font-weight: 600; margin: 0 0 8px 0; font-size: 14px;">Entry Pass</p>
          <p style="color: #6b7280; font-size: 11px; margin: 0 0 6px 0;">Ticket ID:</p>
          <p style="color: #1a1a1a; font-size: 10px; font-weight: 600; margin: 0; font-family: monospace; word-break: break-all;">${ticketId}</p>
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
          <title>Ticket Confirmation - ${event.title}</title>
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
            <tr>
              <td style="padding: 40px 16px;">
                <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
                  
                  <!-- Logo Header -->
                  <tr>
                    <td align="center" style="padding-bottom: 24px;">
                      <span style="color: #1a1a1a; font-size: 20px; font-weight: 700;">UniVoid</span>
                    </td>
                  </tr>
                  
                  <!-- Main Card -->
                  <tr>
                    <td>
                      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
                        
                        <!-- Header -->
                        <tr>
                          <td style="background: #1a1a1a; padding: 24px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Registration Confirmed</h1>
                          </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                          <td style="padding: 24px;">
                            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">
                              Hi ${profile.full_name},
                            </p>
                            <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                              Your registration for <strong>${event.title}</strong> is confirmed. Below is your entry pass.
                            </p>
                            
                            ${qrCodeImageHtml}
                            
                            <!-- Event Details -->
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 24px 0;">
                              <tr>
                                <td style="padding: 16px;">
                                  <p style="margin: 0 0 12px 0; color: #1a1a1a; font-weight: 600; font-size: 14px;">Event Details</p>
                                  <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
                                    <tr>
                                      <td style="padding: 4px 0; color: #6b7280; font-size: 13px; width: 80px;">Event</td>
                                      <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${event.title}</td>
                                    </tr>
                                    <tr>
                                      <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Date</td>
                                      <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${eventDate}</td>
                                    </tr>
                                    <tr>
                                      <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Location</td>
                                      <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${locationText}</td>
                                    </tr>
                                    ${organizer ? `
                                    <tr>
                                      <td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Organizer</td>
                                      <td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${organizer.name}</td>
                                    </tr>
                                    ` : ""}
                                  </table>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- View Ticket Link -->
                            <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
                              <tr>
                                <td align="center">
                                  <a href="https://univoid.tech/my-events" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">View Your Ticket</a>
                                </td>
                              </tr>
                            </table>
                            
                            <!-- Security Note -->
                            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 16px 0 0 0;">
                              Please keep this QR code private and do not share it with others.
                            </p>
                          </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                          <td style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
                            <p style="color: #9ca3af; font-size: 11px; margin: 0;">
                              This is a transactional email from UniVoid regarding your event registration.
                            </p>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    console.log("Sending ticket email to:", profile.email, "for user:", profile.full_name);

    // Use clean subject line without emojis (helps avoid Promotions tab)
    const result = await sendEmailViaBrevo(
      profile.email,
      profile.full_name,
      `Your Ticket Confirmation - ${event.title}`,
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