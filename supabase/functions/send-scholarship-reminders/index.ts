import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting scholarship deadline reminder check...");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all active reminders that haven't been sent yet
    const { data: reminders, error: remindersError } = await supabase
      .from("scholarship_reminders")
      .select(`
        id,
        user_id,
        scholarship_id,
        remind_days_before,
        scholarships (
          id,
          title,
          deadline,
          application_link,
          source_url,
          description
        )
      `)
      .eq("reminder_sent", false);

    if (remindersError) {
      console.error("Error fetching reminders:", remindersError);
      throw remindersError;
    }

    if (!reminders || reminders.length === 0) {
      console.log("No pending reminders found");
      return new Response(
        JSON.stringify({ success: true, message: "No pending reminders", sent: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log(`Found ${reminders.length} pending reminders to check`);

    const now = new Date();
    let sentCount = 0;
    let emailsSent = 0;

    for (const reminder of reminders) {
      const scholarship = reminder.scholarships as any;
      
      if (!scholarship?.deadline) {
        console.log(`Skipping reminder ${reminder.id} - no deadline`);
        continue;
      }

      const deadline = new Date(scholarship.deadline);
      const daysUntilDeadline = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`Scholarship "${scholarship.title}" - ${daysUntilDeadline} days until deadline, reminder set for ${reminder.remind_days_before} days`);

      // Check if it's time to send the reminder
      if (daysUntilDeadline <= reminder.remind_days_before && daysUntilDeadline > 0) {
        console.log(`Sending reminder for scholarship: ${scholarship.title}`);

        // Get user's profile for email
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("id", reminder.user_id)
          .single();

        if (profileError) {
          console.error(`Failed to get user profile: ${profileError.message}`);
        }

        // Create in-app notification
        const { error: notifError } = await supabase.from("notifications").insert({
          user_id: reminder.user_id,
          title: "🎓 Scholarship Deadline Approaching!",
          message: `"${scholarship.title}" deadline is in ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''}. Apply now before it's too late!`,
          type: "scholarship_reminder",
          link: scholarship.application_link || scholarship.source_url || "/scholarships",
        });

        if (notifError) {
          console.error(`Failed to create notification: ${notifError.message}`);
        }

        // Send email notification if user has email
        if (profile?.email) {
          const applyLink = scholarship.application_link || scholarship.source_url || "";
          const deadlineFormatted = new Date(scholarship.deadline).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });

          try {
            const emailResponse = await resend.emails.send({
              from: "Univoid <notifications@univoid.in>",
              to: [profile.email],
              subject: `⏰ ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} left - ${scholarship.title}`,
              html: `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">🎓 Scholarship Deadline Alert</h1>
                  </div>
                  
                  <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #e2e8f0; border-top: none;">
                    <p style="font-size: 16px; margin-bottom: 20px;">Hi ${profile.full_name || 'Student'},</p>
                    
                    <p style="font-size: 16px; margin-bottom: 20px;">
                      This is a friendly reminder that the deadline for <strong>${scholarship.title}</strong> is approaching!
                    </p>
                    
                    <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                      <p style="margin: 0; font-size: 18px; font-weight: bold; color: #92400e;">
                        ⏰ Only ${daysUntilDeadline} day${daysUntilDeadline !== 1 ? 's' : ''} remaining!
                      </p>
                      <p style="margin: 8px 0 0 0; color: #92400e;">
                        Deadline: ${deadlineFormatted}
                      </p>
                    </div>
                    
                    ${scholarship.description ? `
                    <div style="background: white; padding: 15px; border-radius: 8px; margin: 20px 0; border: 1px solid #e2e8f0;">
                      <p style="margin: 0; font-size: 14px; color: #64748b;">${scholarship.description.substring(0, 200)}${scholarship.description.length > 200 ? '...' : ''}</p>
                    </div>
                    ` : ''}
                    
                    ${applyLink ? `
                    <div style="text-align: center; margin: 30px 0;">
                      <a href="${applyLink}" style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; display: inline-block;">
                        Apply Now →
                      </a>
                    </div>
                    ` : ''}
                    
                    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
                    
                    <p style="font-size: 14px; color: #64748b; text-align: center; margin: 0;">
                      You received this email because you set a reminder on Univoid.<br>
                      <a href="https://univoid.in/scholarships" style="color: #6366f1;">View all scholarships</a>
                    </p>
                  </div>
                </body>
                </html>
              `,
            });

            console.log("Email sent successfully:", emailResponse);
            emailsSent++;
          } catch (emailError: any) {
            console.error(`Failed to send email: ${emailError.message}`);
          }
        }

        // Mark reminder as sent
        await supabase
          .from("scholarship_reminders")
          .update({ reminder_sent: true })
          .eq("id", reminder.id);

        sentCount++;
        console.log(`Reminder sent for scholarship: ${scholarship.title}`);
      } else if (daysUntilDeadline <= 0) {
        // Deadline has passed, mark as sent to avoid future checks
        await supabase
          .from("scholarship_reminders")
          .update({ reminder_sent: true })
          .eq("id", reminder.id);
        console.log(`Deadline passed for ${scholarship.title}, marking as sent`);
      }
    }

    console.log(`Completed: ${sentCount} reminders sent, ${emailsSent} emails sent`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${sentCount} scholarship reminders (${emailsSent} emails)`,
        checked: reminders.length,
        sent: sentCount,
        emails: emailsSent,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Scholarship reminder error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
