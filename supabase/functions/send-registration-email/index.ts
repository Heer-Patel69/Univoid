import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

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
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { 
      userEmail, 
      userName, 
      eventTitle, 
      eventDate, 
      eventLocation, 
      isPaid, 
      ticketPrice 
    }: RegistrationEmailRequest = await req.json();

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Registration Confirmation</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
          <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 32px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 28px;">🎉 You're Registered!</h1>
          </div>
          
          <div style="padding: 32px;">
            <p style="color: #333333; font-size: 16px; line-height: 1.6; margin-top: 0;">
              Hi ${userName || 'there'},
            </p>
            
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">
              ${isPaid 
                ? "Your registration has been submitted! We've received your payment screenshot and it's pending verification."
                : "Great news! Your registration has been confirmed."
              }
            </p>
            
            <div style="background-color: #f8f8f8; border-radius: 12px; padding: 24px; margin: 24px 0;">
              <h2 style="color: #1a1a1a; margin: 0 0 16px 0; font-size: 20px;">Event Details</h2>
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="color: #666666; padding: 8px 0; font-size: 14px;">Event</td>
                  <td style="color: #1a1a1a; padding: 8px 0; font-size: 14px; font-weight: 600; text-align: right;">${eventTitle}</td>
                </tr>
                <tr>
                  <td style="color: #666666; padding: 8px 0; font-size: 14px;">Date</td>
                  <td style="color: #1a1a1a; padding: 8px 0; font-size: 14px; text-align: right;">${eventDate}</td>
                </tr>
                <tr>
                  <td style="color: #666666; padding: 8px 0; font-size: 14px;">Location</td>
                  <td style="color: #1a1a1a; padding: 8px 0; font-size: 14px; text-align: right;">${eventLocation || 'TBA'}</td>
                </tr>
                ${isPaid ? `
                <tr>
                  <td style="color: #666666; padding: 8px 0; font-size: 14px;">Amount</td>
                  <td style="color: #1a1a1a; padding: 8px 0; font-size: 14px; font-weight: 600; text-align: right;">₹${ticketPrice}</td>
                </tr>
                ` : ''}
              </table>
            </div>
            
            ${isPaid ? `
            <div style="background-color: #fff8e1; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #f57c00; margin: 0; font-size: 14px;">
                ⏳ <strong>Payment Pending:</strong> Your registration will be confirmed once the organizer verifies your payment.
              </p>
            </div>
            ` : `
            <div style="background-color: #e8f5e9; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
              <p style="color: #2e7d32; margin: 0; font-size: 14px;">
                ✅ <strong>Confirmed:</strong> Your ticket has been generated! Check your tickets in the app.
              </p>
            </div>
            `}
            
            <div style="text-align: center; margin-top: 32px;">
              <a href="https://univoid.lovable.app/my-tickets" 
                 style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 50px; font-weight: 600; font-size: 16px;">
                View My Tickets
              </a>
            </div>
          </div>
          
          <div style="background-color: #f8f8f8; padding: 24px; text-align: center;">
            <p style="color: #999999; font-size: 12px; margin: 0;">
              UniVoid - Where students learn, share, and grow together
            </p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "UniVoid <onboarding@resend.dev>",
        to: [userEmail],
        subject: isPaid 
          ? `Registration Submitted: ${eventTitle}` 
          : `You're Registered: ${eventTitle}`,
        html: emailHtml,
      }),
    });

    const emailData = await emailResponse.json();

    console.log("Email sent successfully:", emailData);

    return new Response(JSON.stringify(emailData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-registration-email function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);