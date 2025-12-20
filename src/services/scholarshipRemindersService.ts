import { supabase } from "@/integrations/supabase/client";

export interface ScholarshipReminder {
  id: string;
  user_id: string;
  scholarship_id: string;
  remind_days_before: number;
  reminder_sent: boolean;
  created_at: string;
}

export const scholarshipRemindersService = {
  async getUserReminders(userId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from("scholarship_reminders")
      .select("scholarship_id")
      .eq("user_id", userId);

    if (error) throw error;
    return (data || []).map(r => r.scholarship_id);
  },

  async addReminder(scholarshipId: string, daysBefore: number = 7): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Not authenticated");

    const { error } = await supabase.from("scholarship_reminders").insert({
      user_id: userData.user.id,
      scholarship_id: scholarshipId,
      remind_days_before: daysBefore,
    });

    if (error) throw error;
  },

  async removeReminder(scholarshipId: string): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) throw new Error("Not authenticated");

    const { error } = await supabase
      .from("scholarship_reminders")
      .delete()
      .eq("user_id", userData.user.id)
      .eq("scholarship_id", scholarshipId);

    if (error) throw error;
  },

  async toggleReminder(scholarshipId: string, hasReminder: boolean): Promise<boolean> {
    if (hasReminder) {
      await this.removeReminder(scholarshipId);
      return false;
    } else {
      await this.addReminder(scholarshipId);
      return true;
    }
  },
};
