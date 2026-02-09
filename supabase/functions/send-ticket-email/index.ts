import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SENDER_NAME = "UniVoid";
const SENDER_EMAIL = "heerpatel1032@gmail.com";

interface TicketEmailRequest {
  ticketId: string;
  registrationId: string;
  eventId: string;
  userId: string;
  qrCode: string;
  attendeesOnly?: boolean;
}

// Generate QR code PNG using external API and upload to storage
async function generateAndUploadQRCode(
  supabase: any,
  ticketId: string,
  qrData: string
): Promise<string | null> {
  try {
    const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}&format=png&margin=10`;
    const response = await fetch(qrApiUrl);
    if (!response.ok) return null;

    const pngBuffer = await response.arrayBuffer();
    const pngBytes = new Uint8Array(pngBuffer);
    const fileName = `qr-${ticketId}.png`;

    const { error } = await supabase.storage
      .from("ticket-qrcodes")
      .upload(fileName, pngBytes, { contentType: "image/png", upsert: true });

    if (error) return null;

    const { data: urlData } = supabase.storage
      .from("ticket-qrcodes")
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } catch (error) {
    console.error("QR generation/upload error:", error);
    return null;
  }
}

// Send email via Brevo REST API
async function sendEmailViaBrevo(
  to: string,
  toName: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY not configured");

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
        subject,
        htmlContent,
        headers: { "X-Priority": "1", "X-MSMail-Priority": "High", "Importance": "high" },
        tags: ["transactional", "ticket", "confirmation"],
      }),
    });

    const responseText = await response.text();
    if (!response.ok) return { success: false, error: `Brevo API error: ${response.status} - ${responseText}` };

    const result = JSON.parse(responseText);
    return { success: true, messageId: result.messageId };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// Build ticket email HTML
function buildTicketEmailHtml(
  recipientName: string,
  eventTitle: string,
  eventDate: string,
  locationText: string,
  organizerName: string | null,
  qrCodeImageHtml: string,
  isGuest: boolean
): string {
  const guestNote = isGuest
    ? `<p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0; font-style: italic;">This ticket was purchased on your behalf. You do not need an account to use it.</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Ticket - ${eventTitle}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
<tr><td style="padding: 40px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
<tr><td align="center" style="padding-bottom: 24px;"><span style="color: #1a1a1a; font-size: 20px; font-weight: 700;">UniVoid</span></td></tr>
<tr><td>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
<tr><td style="background: #1a1a1a; padding: 24px; text-align: center;"><h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">Registration Confirmed</h1></td></tr>
<tr><td style="padding: 24px;">
<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${recipientName},</p>
<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">Your registration for <strong>${eventTitle}</strong> is confirmed. Below is your entry pass.</p>
${guestNote}
${qrCodeImageHtml}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 24px 0;">
<tr><td style="padding: 16px;">
<p style="margin: 0 0 12px 0; color: #1a1a1a; font-weight: 600; font-size: 14px;">Event Details</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px; width: 80px;">Event</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${eventTitle}</td></tr>
<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Date</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${eventDate}</td></tr>
<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Location</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${locationText}</td></tr>
${organizerName ? `<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Organizer</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${organizerName}</td></tr>` : ""}
</table>
</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 24px 0;">
<tr><td align="center"><a href="https://univoid.tech/my-events" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">View Your Ticket</a></td></tr>
</table>
<p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 16px 0 0 0;">Please keep this QR code private and do not share it with others.</p>
</td></tr>
<tr><td style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
<p style="color: #9ca3af; font-size: 11px; margin: 0;">This is a transactional email from UniVoid regarding your event registration.</p>
</td></tr>
</table>
</td></tr></table>
</td></tr></table>
</body></html>`;
}

// Build QR code HTML block
function buildQrHtml(qrImageUrl: string | null, ticketId: string): string {
  const manualEntryCode = ticketId;
  if (qrImageUrl) {
    return `<div style="text-align: center; margin: 24px 0;">
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
</div></div>`;
  }
  return `<div style="text-align: center; margin: 24px 0;">
<div style="display: inline-block; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 24px;">
<p style="color: #1a1a1a; font-weight: 600; margin: 0 0 12px 0; font-size: 14px;">Entry Pass</p>
<div style="padding: 12px; background: #f3f4f6; border-radius: 6px;">
<p style="color: #6b7280; font-size: 11px; margin: 0 0 6px 0;">Ticket ID:</p>
<p style="color: #1a1a1a; font-size: 10px; font-weight: 600; margin: 0; font-family: monospace; word-break: break-all;">${manualEntryCode}</p>
</div>
<p style="color: #6b7280; font-size: 12px; margin: 12px 0 0 0;">Present this ID at the venue</p>
</div></div>`;
}

// Create a real event_ticket record for a guest attendee
async function createGuestTicket(
  supabase: any,
  attendeeId: string,
  registrationId: string,
  eventId: string,
  userId: string
): Promise<{ ticketId: string; qrCode: string } | null> {
  try {
    // Generate a unique QR code for this guest attendee
    const qrCode = `${eventId}:attendee:${attendeeId}:${crypto.randomUUID().slice(0, 8)}`;

    const { data: ticket, error } = await supabase
      .from("event_tickets")
      .insert({
        registration_id: registrationId,
        event_id: eventId,
        user_id: userId, // Link to the buyer's user_id for RLS
        qr_code: qrCode,
        is_used: false,
        is_group_booking: true,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Failed to create guest ticket:", error);
      return null;
    }

    // Link the ticket to the attendee record
    await supabase
      .from("ticket_attendees")
      .update({ ticket_id: ticket.id, qr_code: qrCode })
      .eq("id", attendeeId);

    return { ticketId: ticket.id, qrCode };
  } catch (err) {
    console.error("Error creating guest ticket:", err);
    return null;
  }
}

const handler = async (req: Request): Promise<Response> => {
  if (isCorsPreflightRequest(req)) return handleCorsPreflightRequest(req);
  const corsHeaders = getCorsHeaders(req);

  try {
    if (!BREVO_API_KEY) throw new Error("Email service not configured");

    const { ticketId, registrationId, eventId, userId, qrCode, attendeesOnly }: TicketEmailRequest = await req.json();
    console.log("Processing ticket email:", { ticketId, registrationId, eventId, userId, attendeesOnly });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles").select("full_name, email").eq("id", userId).single();
    if (profileError || !profile) throw new Error("User profile not found");

    // Fetch event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title, start_date, venue_name, venue_address, city, state, is_paid, price, organizer_id")
      .eq("id", eventId).single();
    if (eventError || !event) throw new Error("Event not found");

    const { data: organizer } = await supabase
      .from("organizer_profiles").select("name").eq("user_id", event.organizer_id).single();

    const eventDate = new Date(event.start_date).toLocaleDateString("en-US", {
      weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

    const locationText = event.venue_name
      ? `${event.venue_name}${event.city ? `, ${event.city}` : ""}${event.state ? `, ${event.state}` : ""}`
      : event.city && event.state ? `${event.city}, ${event.state}` : "Location TBA";

    const organizerName = organizer?.name || null;

    // --- Send primary ticket email to the registered user (skip if attendeesOnly) ---
    let result = { success: true, messageId: "" };
    if (!attendeesOnly) {
      const qrImageUrl = await generateAndUploadQRCode(supabase, ticketId, qrCode);
      const qrHtml = buildQrHtml(qrImageUrl, ticketId);
      const emailHtml = buildTicketEmailHtml(profile.full_name, event.title, eventDate, locationText, organizerName, qrHtml, false);

      result = await sendEmailViaBrevo(
        profile.email, profile.full_name,
        `Your Ticket Confirmation - ${event.title}`, emailHtml
      );

      if (!result.success) throw new Error(`Email delivery failed: ${result.error}`);
      console.log("✅ Primary ticket email sent to:", profile.email);
    } else {
      console.log("⏭️ Skipping primary user email (attendeesOnly mode)");
    }

    // --- Send individual QR emails to guest attendees ---
    let guestEmailsSent = 0;
    try {
      const { data: attendees } = await supabase
        .from("ticket_attendees")
        .select("id, attendee_name, attendee_email, attendee_mobile, ticket_category_id, ticket_id, qr_code")
        .eq("registration_id", registrationId);

      if (attendees && attendees.length > 0) {
        // Filter out the primary user's own email to avoid duplicate
        const guestAttendees = attendees.filter(
          (a: any) => a.attendee_email && a.attendee_email.toLowerCase() !== profile.email.toLowerCase()
        );

        for (const attendee of guestAttendees) {
          try {
            let guestTicketId = attendee.ticket_id;
            let guestQrCode = attendee.qr_code;

            // Create a real ticket record if the attendee doesn't have one yet
            if (!guestTicketId) {
              const ticketResult = await createGuestTicket(supabase, attendee.id, registrationId, eventId, userId);
              if (ticketResult) {
                guestTicketId = ticketResult.ticketId;
                guestQrCode = ticketResult.qrCode;
              } else {
                // Fallback: use attendee ID but log the issue
                console.error(`Could not create ticket for attendee ${attendee.id}, skipping email`);
                continue;
              }
            }

            // Generate QR code image from the real QR code data
            const guestQrUrl = await generateAndUploadQRCode(supabase, guestTicketId, guestQrCode);
            const guestQrHtml = buildQrHtml(guestQrUrl, guestTicketId);
            const guestHtml = buildTicketEmailHtml(
              attendee.attendee_name, event.title, eventDate, locationText, organizerName, guestQrHtml, true
            );

            const guestResult = await sendEmailViaBrevo(
              attendee.attendee_email,
              attendee.attendee_name,
              `Your Ticket - ${event.title}`,
              guestHtml
            );

            if (guestResult.success) {
              guestEmailsSent++;
            }
            console.log(`Guest email ${guestResult.success ? "sent" : "failed"}: ${attendee.attendee_email}`);
          } catch (guestError) {
            console.error(`Failed to send guest email to ${attendee.attendee_email}:`, guestError);
          }
        }
      }
    } catch (attendeeError) {
      console.error("Error processing guest attendees:", attendeeError);
    }

    return new Response(JSON.stringify({
      success: true,
      messageId: result.messageId,
      recipient: profile.email,
      guestEmailsSent,
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ ERROR in send-ticket-email:", error.message);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
