import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
          source_url
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
        } else {
          // Mark reminder as sent
          await supabase
            .from("scholarship_reminders")
            .update({ reminder_sent: true })
            .eq("id", reminder.id);

          sentCount++;
          console.log(`Reminder sent for scholarship: ${scholarship.title}`);
        }
      } else if (daysUntilDeadline <= 0) {
        // Deadline has passed, mark as sent to avoid future checks
        await supabase
          .from("scholarship_reminders")
          .update({ reminder_sent: true })
          .eq("id", reminder.id);
        console.log(`Deadline passed for ${scholarship.title}, marking as sent`);
      }
    }

    console.log(`Completed: ${sentCount} reminders sent`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Sent ${sentCount} scholarship reminders`,
        checked: reminders.length,
        sent: sentCount,
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
