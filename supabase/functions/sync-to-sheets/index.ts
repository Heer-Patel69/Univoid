import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SheetSyncRequest {
  eventId: string;
  spreadsheetId: string;
  sheetName?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const serviceAccountKey = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_KEY");
    if (!serviceAccountKey) {
      throw new Error("Google Service Account not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { eventId, spreadsheetId, sheetName = "Registrations" }: SheetSyncRequest = await req.json();

    if (!eventId || !spreadsheetId) {
      throw new Error("Missing eventId or spreadsheetId");
    }

    // Fetch registrations with profiles
    const { data: registrations, error: regError } = await supabase
      .rpc("get_event_registrations_with_profiles", { p_event_id: eventId });

    if (regError) throw regError;

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title, start_date")
      .eq("id", eventId)
      .single();

    if (eventError) throw eventError;

    // Parse service account key
    const credentials = JSON.parse(serviceAccountKey);

    // Get access token using JWT
    const accessToken = await getGoogleAccessToken(credentials);

    // Prepare data for sheets
    const headers = [
      "Registration ID",
      "Full Name",
      "Email",
      "Mobile",
      "College",
      "Payment Status",
      "Registered At",
      "Club Membership",
      "Applied Price",
      "Custom Data",
    ];

    const rows = (registrations || []).map((reg: Record<string, unknown>) => {
      const customData = reg.custom_data as Record<string, unknown> || {};
      return [
        reg.registration_id,
        reg.full_name || "",
        reg.email || "",
        reg.mobile_number || "",
        reg.college_name || "",
        reg.payment_status,
        new Date(reg.created_at as string).toLocaleString(),
        customData._club_id ? "Yes" : "No",
        customData._applied_price || "",
        JSON.stringify(customData),
      ];
    });

    // Clear and update sheet
    await clearSheet(accessToken, spreadsheetId, sheetName);
    await updateSheet(accessToken, spreadsheetId, sheetName, [headers, ...rows]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${rows.length} registrations to Google Sheets`,
        rowCount: rows.length 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Sheets sync error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function getGoogleAccessToken(credentials: { client_email: string; private_key: string }) {
  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  // Create JWT
  const encoder = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  
  const signatureInput = `${headerB64}.${payloadB64}`;
  
  // Import private key and sign
  const privateKey = credentials.private_key.replace(/\\n/g, "\n");
  const pemContents = privateKey
    .replace("-----BEGIN PRIVATE KEY-----", "")
    .replace("-----END PRIVATE KEY-----", "")
    .replace(/\s/g, "");
  
  const binaryKey = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));
  
  const cryptoKey = await crypto.subtle.importKey(
    "pkcs8",
    binaryKey,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    cryptoKey,
    encoder.encode(signatureInput)
  );

  const signatureB64 = btoa(String.fromCharCode(...new Uint8Array(signature)))
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${signatureInput}.${signatureB64}`;

  // Exchange JWT for access token
  const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  const tokenData = await tokenResponse.json();
  if (tokenData.error) {
    throw new Error(`Google auth error: ${tokenData.error_description || tokenData.error}`);
  }

  return tokenData.access_token;
}

async function clearSheet(accessToken: string, spreadsheetId: string, sheetName: string) {
  await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:clear`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
}

async function updateSheet(accessToken: string, spreadsheetId: string, sheetName: string, data: (string | number | boolean)[][]) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ values: data }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Sheets API error: ${error.error?.message || "Unknown error"}`);
  }
}
