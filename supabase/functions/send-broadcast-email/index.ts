import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, isCorsPreflightRequest, handleCorsPreflightRequest } from "../_shared/cors.ts";

// Brevo API Configuration
const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");

const SENDER_NAME = "UniVoid";
const SENDER_EMAIL = "heerpatel1032@gmail.com";

type AudienceType = 'all' | 'registered' | 'external';

interface EmailButton {
  label: string;
  url: string;
}

interface BroadcastRequest {
  subject: string;
  message: string;
  buttons?: EmailButton[];
  audienceType?: AudienceType;
  externalEmails?: string[];
  // Legacy fields for backward compatibility
  title?: string;
  ctaText?: string;
  ctaUrl?: string;
  adminKey?: string;
  testEmail?: string;
  senderId?: string;
}

// Send email via Brevo REST API
async function sendEmailViaBrevo(
  to: string,
  subject: string,
  htmlContent: string
): Promise<{ success: boolean; error?: string }> {
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

    const responseText = await response.text();
    
    if (!response.ok) {
      console.error(`Brevo API error for ${to}:`, response.status, responseText);
      
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

// UniVoid logo as base64 embedded SVG
const UNIVOID_LOGO = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 40" width="120" height="40">
  <defs>
    <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#8B5CF6"/>
      <stop offset="100%" style="stop-color:#D946EF"/>
    </linearGradient>
  </defs>
  <text x="10" y="28" font-family="Arial, sans-serif" font-size="24" font-weight="bold" fill="url(#logoGrad)">UniVoid</text>
</svg>`;

// Generate custom email HTML with full flexibility
function generateCustomEmail(message: string, userName?: string, buttons?: EmailButton[]): string {
  // Replace placeholder
  const processedMessage = message.replace(/\{\{userName\}\}/g, userName || 'User');
  
  // Check if message already contains HTML structure
  const hasHtmlStructure = /<html|<body|<table/i.test(processedMessage);
  
  if (hasHtmlStructure) {
    // Return as-is if it's already formatted HTML
    return processedMessage;
  }
  
  // Generate buttons HTML
  const buttonsHtml = buttons && buttons.length > 0 
    ? `
      <tr>
        <td style="padding: 24px 32px 0;">
          <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%;">
            <tr>
              <td style="text-align: center;">
                ${buttons.map(btn => `
                  <a href="${btn.url}" target="_blank" style="display: inline-block; margin: 6px 8px; padding: 14px 28px; background: linear-gradient(135deg, #8B5CF6 0%, #D946EF 100%); color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px; box-shadow: 0 4px 14px rgba(139, 92, 246, 0.4);">
                    ${btn.label}
                  </a>
                `).join('')}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `
    : '';
  
  // Wrap in a branded email template with UniVoid logo
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>UniVoid</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f4f4f5;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width: 100%; background-color: #f4f4f5;">
        <tr>
          <td style="padding: 40px 20px;">
            <table role="presentation" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header with Logo -->
              <tr>
                <td style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); padding: 30px 40px; text-align: center;">
                  <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                    <tr>
                      <td>
                        ${UNIVOID_LOGO}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 32px;">
                  <div style="color: #333333; font-size: 16px; line-height: 1.8;">
                    ${processedMessage.split('\n').map(line => 
                      line.trim() ? `<p style="margin: 0 0 16px 0;">${line}</p>` : ''
                    ).join('')}
                  </div>
                </td>
              </tr>
              
              <!-- Buttons -->
              ${buttonsHtml}
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #f8f8f8; padding: 24px 32px; text-align: center; margin-top: 20px;">
                  <p style="color: #666666; font-size: 14px; margin: 0 0 8px 0;">
                    © ${new Date().getFullYear()} UniVoid. All rights reserved.
                  </p>
                  <p style="color: #999999; font-size: 12px; margin: 0;">
                    <a href="https://univoid.lovable.app" style="color: #8B5CF6; text-decoration: none;">univoid.lovable.app</a>
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

  if (isCorsPreflightRequest(req)) {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    if (!BREVO_API_KEY) {
      throw new Error("BREVO_API_KEY not configured");
    }

    const body: BroadcastRequest = await req.json();
    const { subject, message, buttons, audienceType = 'all', externalEmails, adminKey, testEmail, senderId, title } = body;

    // Simple admin protection
    if (adminKey !== "UNIVOID_BROADCAST_2025") {
      throw new Error("Unauthorized: Admin access required");
    }

    // Support legacy format (title + message) or new format (message only)
    const emailContent = message || title || '';
    
    if (!subject || !emailContent) {
      throw new Error("Missing required fields: subject and message");
    }

    // Handle external emails (no database lookup needed)
    if (audienceType === 'external') {
      if (!externalEmails || externalEmails.length === 0) {
        throw new Error("No external emails provided");
      }

      console.log(`Sending to ${externalEmails.length} external emails`);

      let sent = 0;
      let failed = 0;
      const errors: string[] = [];

      for (const email of externalEmails) {
        const emailHtml = generateCustomEmail(emailContent, 'there', buttons);
        console.log(`Sending to external: ${email}...`);
        const result = await sendEmailViaBrevo(email, subject, emailHtml);
        
        if (result.success) {
          sent++;
          console.log(`✅ Sent to ${email}`);
        } else {
          failed++;
          errors.push(`${email}: ${result.error}`);
          console.error(`❌ Failed: ${email} - ${result.error}`);
          
          // If first email fails with API key error, stop
          if (sent === 0 && failed === 1 && result.error?.includes("API Key")) {
            throw new Error("Brevo API Key is invalid");
          }
        }

        // Rate limit: 100ms delay between emails
        await delay(100);
      }

      console.log(`External broadcast complete: ${sent} sent, ${failed} failed`);

      // Create Supabase client for logging
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Log the broadcast email
      if (senderId) {
        await supabase.from("email_logs").insert({
          sender_id: senderId,
          sender_type: "admin",
          event_id: null,
          subject: `[EXTERNAL] ${subject}`,
          body_preview: emailContent.substring(0, 200),
          recipients_count: sent + failed,
          status: failed === 0 ? "sent" : sent === 0 ? "failed" : "partial",
          error_message: errors.length > 0 ? errors.slice(0, 5).join("; ") : null,
          sent_at: new Date().toISOString(),
        });
      }

      return new Response(JSON.stringify({
        success: sent > 0,
        message: `External broadcast complete`,
        audienceType: 'external',
        total: externalEmails.length,
        sent,
        failed,
        errors: errors.slice(0, 10)
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Create Supabase client for platform users
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // If testEmail provided, just send to that one email
    if (testEmail) {
      console.log(`Sending TEST email to: ${testEmail}`);
      const emailHtml = generateCustomEmail(emailContent, 'Test User', buttons);
      const result = await sendEmailViaBrevo(testEmail, subject, emailHtml);
      
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

    // Get users who have registered for events
    const { data: registeredUsers, error: regError } = await supabase
      .from("event_registrations")
      .select("user_id");
    
    if (regError) {
      console.error("Failed to fetch registrations:", regError);
      throw new Error("Failed to fetch registration data");
    }

    const registeredUserIds = new Set(registeredUsers?.map(r => r.user_id) || []);
    console.log(`Found ${registeredUserIds.size} registered users`);

    // Fetch all user profiles
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

    // Filter profiles based on audience type
    let targetProfiles = profiles;
    
    if (audienceType === 'registered') {
      targetProfiles = profiles.filter(p => registeredUserIds.has(p.id));
      console.log(`Filtered to ${targetProfiles.length} registered users`);
    }

    if (targetProfiles.length === 0) {
      return new Response(JSON.stringify({
        success: true,
        message: `No ${audienceType} users found`,
        sent: 0,
        failed: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    console.log(`Sending to ${targetProfiles.length} users (audience: ${audienceType})`);

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // Send emails with rate limiting
    for (const profile of targetProfiles) {
      if (!profile.email) continue;

      const emailHtml = generateCustomEmail(emailContent, profile.full_name, buttons);
      console.log(`Sending to ${profile.email}...`);
      const result = await sendEmailViaBrevo(profile.email, subject, emailHtml);
      
      if (result.success) {
        sent++;
        console.log(`✅ Sent to ${profile.email}`);
      } else {
        failed++;
        errors.push(`${profile.email}: ${result.error}`);
        console.error(`❌ Failed: ${profile.email} - ${result.error}`);
        
        // If first email fails with API key error, stop
        if (sent === 0 && failed === 1 && result.error?.includes("API Key")) {
          throw new Error("Brevo API Key is invalid");
        }
      }

      // Rate limit: 100ms delay between emails
      await delay(100);
    }

    console.log(`Broadcast complete: ${sent} sent, ${failed} failed`);

    // Log the broadcast email
    if (senderId) {
      await supabase.from("email_logs").insert({
        sender_id: senderId,
        sender_type: "admin",
        event_id: null,
        subject: `[${audienceType.toUpperCase()}] ${subject}`,
        body_preview: emailContent.substring(0, 200),
        recipients_count: sent + failed,
        status: failed === 0 ? "sent" : sent === 0 ? "failed" : "partial",
        error_message: errors.length > 0 ? errors.slice(0, 5).join("; ") : null,
        sent_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({
      success: sent > 0,
      message: `Broadcast complete`,
      audienceType,
      total: targetProfiles.length,
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