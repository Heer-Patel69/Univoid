import { supabase } from "@/integrations/supabase/client";

export interface SheetSyncConfig {
  id?: string;
  event_id: string;
  spreadsheet_id: string;
  sheet_name: string;
  auto_sync: boolean;
  last_sync_at?: string;
}

// Sync registrations to Google Sheets
export async function syncToGoogleSheets(
  eventId: string,
  spreadsheetId: string,
  sheetName: string = ""
): Promise<{ success: boolean; message: string; rowCount?: number; sheetName?: string }> {
  const { data, error } = await supabase.functions.invoke("sync-to-sheets", {
    body: { eventId, spreadsheetId, sheetName: sheetName || undefined },
  });

  if (error) throw error;
  return data;
}

// Helper to extract spreadsheet ID from URL
export function extractSpreadsheetId(url: string): string | null {
  const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  return match ? match[1] : null;
}

// Validate spreadsheet URL format
export function isValidSpreadsheetUrl(url: string): boolean {
  return /docs\.google\.com\/spreadsheets\/d\/[a-zA-Z0-9-_]+/.test(url);
}
