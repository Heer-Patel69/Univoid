import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Brevo SMTP Configuration
const BREVO_SMTP_HOST = Deno.env.get("BREVO_SMTP_HOST") || "smtp-relay.brevo.com";
const BREVO_SMTP_PORT = parseInt(Deno.env.get("BREVO_SMTP_PORT") || "587");
const BREVO_SMTP_LOGIN = Deno.env.get("BREVO_SMTP_LOGIN");
const BREVO_SMTP_PASSWORD = Deno.env.get("BREVO_SMTP_PASSWORD");

const SENDER_NAME = "UniVoid";
const SENDER_EMAIL = "no-reply@univoid.tech";

interface BroadcastRequest {
  subject: string;
  title: string;
  message: string;
  ctaText?: string;
  ctaUrl?: string;
  adminKey?: string;
  testEmail?: string; // Optional: send to single email for testing
}

// Use fetch-based email sending with mailchannels (free for edge functions)
// or fallback to showing SMTP config issue
async function sendEmailViaMailChannels(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Try Brevo transactional API with SMTP key (some Brevo accounts use this)
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": BREVO_SMTP_PASSWORD!,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        sender: { name: SENDER_NAME, email: SENDER_EMAIL },
        to: [{ email: to }],
        subject: subject,
        htmlContent: htmlContent,
      }),
    });

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`Brevo API error for ${to}:`, response.status, responseText);
      
      // If 401, the API key format is wrong - provide helpful message
      if (response.status === 401) {
        return { 
          success: false, 
          error: "API Key invalid - need Brevo API key (not SMTP password)" 
        };
      }
      return { success: false, error: `API error: ${response.status}` };
    }

    console.log(`Email sent to ${to}:`, responseText);
    return { success: true };
  } catch (error: any) {
    console.error("Email send error:", error);
    return { success: false, error: error.message };
  }
}

// Generate announcement email HTML
function generateAnnouncementEmail(title: string, message: string, ctaText?: string, ctaUrl?: string): string {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f4f4f5;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header with Logo -->
              <tr>
                <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 40px; text-align: center;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">
                    ✨ UniVoid
                  </h1>
                  <p style="color: rgba(255,255,255,0.8); margin: 12px 0 0 0; font-size: 16px;">
                    Where students learn, share, and grow together
                  </p>
                </td>
              </tr>
              
              <!-- Announcement Banner -->
              <tr>
                <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 24px; text-align: center;">
                  <h2 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700;">
                    🎉 ${title}
                  </h2>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 32px;">
                  <div style="color: #333333; font-size: 16px; line-height: 1.8;">
                    ${message.split('\n').map(line => `<p style="margin: 0 0 16px 0;">${line}</p>`).join('')}
                  </div>
                  
                  ${ctaText && ctaUrl ? `
                  <div style="text-align: center; margin-top: 32px;">
                    <a href="${ctaUrl}" 
                       style="display: inline-block; background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 50px; font-weight: 600; font-size: 16px; box-shadow: 0 4px 14px rgba(0,0,0,0.25);">
                      ${ctaText} →
                    </a>
                  </div>
                  ` : ''}
                  
                  <!-- Features Grid -->
                  <div style="margin-top: 40px; padding: 24px; background: #f8f8f8; border-radius: 12px;">
                    <p style="color: #666666; font-size: 14px; font-weight: 600; margin: 0 0 16px 0; text-align: center;">What's waiting for you:</p>
                    <table style="width: 100%;">
                      <tr>
                        <td style="padding: 8px; text-align: center;">
                          <p style="margin: 0; font-size: 24px;">📚</p>
                          <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Study Materials</p>
                        </td>
                        <td style="padding: 8px; text-align: center;">
                          <p style="margin: 0; font-size: 24px;">🎪</p>
                          <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Campus Events</p>
                        </td>
                        <td style="padding: 8px; text-align: center;">
                          <p style="margin: 0; font-size: 24px;">📖</p>
                          <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">Book Exchange</p>
                        </td>
                        <td style="padding: 8px; text-align: center;">
                          <p style="margin: 0; font-size: 24px;">🏆</p>
                          <p style="margin: 4px 0 0 0; font-size: 12px; color: #666;">XP & Ranks</p>
                        </td>
                      </tr>
                    </table>
                  </div>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f8f8; padding: 24px 32px; text-align: center;">
                  <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0;">
                    © ${new Date().getFullYear()} UniVoid. All rights reserved.
                  </p>
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    <a href="https://univoid.lovable.app" style="color: #666666; text-decoration: none;">univoid.lovable.app</a>
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

// Add delay between emails to avoid rate limits
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const handler = async (req: Request): Promise<Response> => {
  console.log("Broadcast email function called");
  console.log("SMTP Config:", { 
    host: BREVO_SMTP_HOST, 
    port: BREVO_SMTP_PORT, 
    login: BREVO_SMTP_LOGIN,
    hasPassword: !!BREVO_SMTP_PASSWORD,
    passwordLength: BREVO_SMTP_PASSWORD?.length 
  });

  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    if (!BREVO_SMTP_PASSWORD) {
      throw new Error("SMTP credentials not configured");
    }

    const { subject, title, message, ctaText, ctaUrl, adminKey, testEmail }: BroadcastRequest = await req.json();

    // Simple admin protection
    if (adminKey !== "UNIVOID_BROADCAST_2025") {
      throw new Error("Unauthorized: Admin access required");
    }

    if (!subject || !title || !message) {
      throw new Error("Missing required fields: subject, title, message");
    }

    // Generate email HTML
    const emailHtml = generateAnnouncementEmail(title, message, ctaText, ctaUrl);

    // If testEmail provided, just send to that one email
    if (testEmail) {
      console.log(`Sending TEST email to: ${testEmail}`);
      const result = await sendEmailViaMailChannels(testEmail, subject, emailHtml);
      
      return new Response(JSON.stringify({
        success: result.success,
        message: result.success ? `Test email sent to ${testEmail}` : `Failed: ${result.error}`,
        testEmail: testEmail,
        error: result.error
      }), {
        status: result.success ? 200 : 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch all user emails
    const { data: profiles, error: profilesError } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("is_disabled", false)
      .not("email", "is", null);

    if (profilesError) {
      console.error("Failed to fetch profiles:", profilesError);
      throw new Error("Failed to fetch user list");
    }

    if (!profiles || profiles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: "No users to send emails to",
        sent: 0,
        failed: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Found ${profiles.length} users to email`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send emails with rate limiting
    for (const profile of profiles) {
      if (!profile.email) continue;

      console.log(`Sending to ${profile.email}...`);
      const result = await sendEmailViaMailChannels(profile.email, subject, emailHtml);
      
      if (result.success) {
        sent++;
        console.log(`✅ Sent to ${profile.email}`);
      } else {
        failed++;
        errors.push(`${profile.email}: ${result.error}`);
        console.error(`❌ Failed: ${profile.email} - ${result.error}`);
        
        // If first email fails with API key error, stop and report
        if (sent === 0 && failed === 1 && result.error?.includes("API Key")) {
          throw new Error("Brevo API Key is invalid. Please update BREVO_SMTP_PASSWORD with the Brevo API key (not SMTP password). Get it from: https://app.brevo.com/settings/keys/api");
        }
      }

      // Rate limit: 100ms delay between emails
      await delay(100);
    }

    console.log(`Broadcast complete: ${sent} sent, ${failed} failed`);

    return new Response(JSON.stringify({
      success: sent > 0,
      message: `Broadcast complete`,
      total: profiles.length,
      sent,
      failed,
      errors: errors.slice(0, 10)
    }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });

  } catch (error: any) {
    console.error("❌ Broadcast error:", error.message);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
