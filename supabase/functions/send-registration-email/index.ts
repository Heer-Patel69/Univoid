import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
const SENDER_NAME = "UniVoid";
const SENDER_EMAIL = "heerpatel1032@gmail.com";

interface RegistrationEmailRequest {
  userEmail: string;
  userName: string;
  eventTitle: string;
  eventDate: string;
  eventLocation: string;
  isPaid: boolean;
  ticketPrice?: number;
}

const handler = async (req: Request): Promise<Response> => {
  if (isCorsPreflightRequest(req)) return handleCorsPreflightRequest(req);
  const corsHeaders = getCorsHeaders(req);

  try {
    if (!BREVO_API_KEY) throw new Error("BREVO_API_KEY not configured");

    const {
      userEmail, userName, eventTitle, eventDate, eventLocation, isPaid, ticketPrice
    }: RegistrationEmailRequest = await req.json();

    const emailHtml = `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Registration ${isPaid ? 'Submitted' : 'Confirmed'}</title></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f9fafb;">
<tr><td style="padding: 40px 16px;">
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width: 520px; margin: 0 auto;">
<tr><td align="center" style="padding-bottom: 24px;"><span style="color: #1a1a1a; font-size: 20px; font-weight: 700;">UniVoid</span></td></tr>
<tr><td>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
<tr><td style="background: #1a1a1a; padding: 24px; text-align: center;">
<h1 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">${isPaid ? 'Registration Submitted' : 'Registration Confirmed'}</h1>
</td></tr>
<tr><td style="padding: 24px;">
<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 16px 0;">Hi ${userName || 'there'},</p>
<p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
${isPaid
  ? `Your registration for <strong>${eventTitle}</strong> has been submitted. Your payment is pending verification by the organizer.`
  : `Great news! Your registration for <strong>${eventTitle}</strong> is confirmed.`
}
</p>
${isPaid
  ? `<div style="background: #fffbeb; border: 1px solid #fbbf24; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px 0;">
<p style="color: #92400e; font-size: 13px; margin: 0;">Payment Pending - Your registration will be confirmed once the organizer verifies your payment.</p>
</div>`
  : `<div style="background: #ecfdf5; border: 1px solid #34d399; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px 0;">
<p style="color: #065f46; font-size: 13px; margin: 0;">Confirmed - Your ticket has been generated! Check your tickets in the app.</p>
</div>`
}
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; margin: 0 0 24px 0;">
<tr><td style="padding: 16px;">
<p style="margin: 0 0 12px 0; color: #1a1a1a; font-weight: 600; font-size: 14px;">Event Details</p>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%">
<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px; width: 80px;">Event</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${eventTitle}</td></tr>
<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Date</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${eventDate}</td></tr>
<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Location</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px;">${eventLocation || 'TBA'}</td></tr>
${isPaid && ticketPrice ? `<tr><td style="padding: 4px 0; color: #6b7280; font-size: 13px;">Amount</td><td style="padding: 4px 0; color: #1a1a1a; font-size: 13px; font-weight: 600;">₹${ticketPrice}</td></tr>` : ''}
</table>
</td></tr></table>
<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin: 0 0 16px 0;">
<tr><td align="center"><a href="https://univoid.tech/my-tickets" target="_blank" style="display: inline-block; padding: 12px 24px; background-color: #1a1a1a; color: #ffffff; font-size: 14px; font-weight: 600; text-decoration: none; border-radius: 6px;">View My Tickets</a></td></tr>
</table>
</td></tr>
<tr><td style="background: #f9fafb; padding: 16px 24px; text-align: center; border-top: 1px solid #e5e7eb;">
<p style="color: #9ca3af; font-size: 11px; margin: 0;">This is a transactional email from UniVoid regarding your event registration.</p>
</td></tr>
</table>
</td></tr></table>
</td></tr></table>
</body></html>`;

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_API_KEY,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: userEmail, name: userName }],
        subject: isPaid
          ? `Registration Submitted - ${eventTitle}`
          : `Registration Confirmed - ${eventTitle}`,
        htmlContent: emailHtml,
        headers: { "X-Priority": "1", "X-MSMail-Priority": "High", "Importance": "high" },
        tags: ["transactional", "registration"],
      }),
    });

    const responseText = await response.text();
    if (!response.ok) throw new Error(`Brevo API error: ${response.status} - ${responseText}`);

    const result = JSON.parse(responseText);
    console.log("✅ Registration email sent to:", userEmail);

    return new Response(JSON.stringify({ success: true, messageId: result.messageId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ Error in send-registration-email:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
