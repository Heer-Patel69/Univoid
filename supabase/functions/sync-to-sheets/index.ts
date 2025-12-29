import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SheetSyncRequest {
  action?: "sync" | "get-info";
  eventId?: string;
  spreadsheetId?: string;
  sheetName?: string;
}

interface FormField {
  id: string;
  label: string;
  field_type: string;
  field_order: number;
  is_required: boolean;
  options?: { label: string; value: string }[] | null;
}

interface Registration {
  id: string;
  created_at: string;
  payment_status: string;
  custom_data: Record<string, unknown> | null;
  user_id: string;
  profile?: {
    full_name?: string;
    email?: string;
    mobile_number?: string;
    college_name?: string;
  } | null;
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

    const body = await req.json();
    const { action = "sync", eventId, spreadsheetId, sheetName } = body as SheetSyncRequest;

    // Handle get-info action - just return service account email
    if (action === "get-info") {
      try {
        const credentials = JSON.parse(serviceAccountKey);
        return new Response(
          JSON.stringify({ 
            serviceAccountEmail: credentials.client_email,
            configured: true
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      } catch {
        return new Response(
          JSON.stringify({ configured: false, error: "Invalid service account configuration" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // For sync action, validate required fields
    if (!eventId || !spreadsheetId) {
      throw new Error("Missing eventId or spreadsheetId");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log(`Starting dynamic sync for event: ${eventId}`);

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("title, start_date, organizer_id, is_paid, price")
      .eq("id", eventId)
      .single();

    if (eventError) throw eventError;

    // Fetch form fields for the event (sorted by field_order)
    const { data: formFields, error: fieldsError } = await supabase
      .from("event_form_fields")
      .select("id, label, field_type, field_order, is_required, options")
      .eq("event_id", eventId)
      .order("field_order", { ascending: true });

    if (fieldsError) {
      console.error("Error fetching form fields:", fieldsError);
      // Continue without form fields - use fallback columns
    }

    console.log(`Found ${formFields?.length || 0} custom form fields`);

    // Fetch registrations (without join - no FK relationship to profiles)
    const { data: registrations, error: regError } = await supabase
      .from("event_registrations")
      .select("id, created_at, payment_status, custom_data, user_id")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (regError) throw regError;

    // Fetch profiles separately for all user_ids
    const userIds = (registrations || []).map(r => r.user_id).filter(Boolean);
    let profileMap = new Map<string, { full_name?: string; email?: string; mobile_number?: string; college_name?: string }>();
    
    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, email, mobile_number, college_name")
        .in("id", userIds);

      if (profilesError) {
        console.error("Error fetching profiles:", profilesError);
      } else {
        (profiles || []).forEach(p => profileMap.set(p.id, p));
      }
    }

    console.log(`Found ${registrations?.length || 0} registrations, ${profileMap.size} profiles`);

    // Attach profiles to registrations
    const registrationsWithProfiles = (registrations || []).map(reg => ({
      ...reg,
      profile: profileMap.get(reg.user_id) || null
    })) as Registration[];

    // Parse service account key
    const credentials = JSON.parse(serviceAccountKey);

    // Get access token using JWT
    const accessToken = await getGoogleAccessToken(credentials);

    // Validate sheet access before proceeding
    const validationResult = await validateSheetAccess(accessToken, spreadsheetId, credentials.client_email);
    if (!validationResult.accessible) {
      return new Response(
        JSON.stringify({ 
          error: validationResult.error,
          hint: validationResult.hint,
          serviceAccountEmail: credentials.client_email
        }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Determine actual sheet name - use provided if it exists, otherwise use first sheet
    let actualSheetName = validationResult.firstSheetName || "Sheet1";
    
    if (sheetName && sheetName.trim()) {
      // Check if the requested sheet exists
      const sheetExists = validationResult.allSheetNames?.includes(sheetName.trim());
      if (sheetExists) {
        actualSheetName = sheetName.trim();
      } else {
        console.log(`Requested sheet "${sheetName}" not found, using first sheet "${actualSheetName}" instead`);
      }
    }
    
    console.log(`Using sheet name: ${actualSheetName}`);

    // Build dynamic headers
    const headers = buildDynamicHeaders(formFields || [], event);
    
    // Build rows with dynamic column mapping
    const rows = registrationsWithProfiles.map((reg) => 
      buildDynamicRow(reg, formFields || [], event)
    );

    console.log(`Syncing ${rows.length} registrations with ${headers.length} columns`);

    // Clear and update sheet
    await clearSheet(accessToken, spreadsheetId, actualSheetName);
    await updateSheet(accessToken, spreadsheetId, actualSheetName, [headers, ...rows]);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Synced ${rows.length} registrations to sheet "${actualSheetName}"`,
        rowCount: rows.length,
        columnCount: headers.length,
        sheetName: actualSheetName
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

// Build dynamic column headers based on form schema
function buildDynamicHeaders(
  formFields: FormField[], 
  event: { is_paid: boolean; title: string }
): string[] {
  // Fixed columns that always appear first
  const fixedHeaders = [
    "Timestamp",
    "Registration ID",
    "Full Name",
    "Email",
    "Mobile",
    "College",
    "Payment Status",
  ];

  // Add payment amount column if event is paid
  if (event.is_paid) {
    fixedHeaders.push("Amount Paid");
  }

  // Add club membership columns
  fixedHeaders.push("Club Member", "Club Name", "Club ID");

  // Add dynamic form field columns (in order)
  const dynamicHeaders = formFields.map(field => field.label);

  return [...fixedHeaders, ...dynamicHeaders];
}

// Build a row with dynamic column mapping
function buildDynamicRow(
  reg: Registration,
  formFields: FormField[],
  event: { is_paid: boolean }
): string[] {
  const customData = reg.custom_data || {};
  const profile = reg.profile;

  // Fixed columns
  const row: string[] = [
    // Timestamp
    reg.created_at ? new Date(reg.created_at).toLocaleString() : "",
    // Registration ID
    String(reg.id || ""),
    // Profile fields
    String(profile?.full_name || ""),
    String(profile?.email || ""),
    String(profile?.mobile_number || ""),
    String(profile?.college_name || ""),
    // Payment status
    String(reg.payment_status || ""),
  ];

  // Add payment amount if paid event
  if (event.is_paid) {
    row.push(String(customData._applied_price || customData._amount || ""));
  }

  // Club membership columns
  const isClubMember = Boolean(customData._club_id || customData._is_club_member);
  row.push(isClubMember ? "Yes" : "No");
  row.push(String(customData._club_name || ""));
  row.push(String(customData._club_membership_id || customData._membership_id || ""));

  // Add dynamic form field values (in order)
  for (const field of formFields) {
    try {
      const value = getFieldValue(customData, field);
      row.push(value);
    } catch (e) {
      console.error(`Error extracting field ${field.label}:`, e);
      row.push(""); // Don't fail entire sync
    }
  }

  return row;
}

// Extract field value from custom_data
function getFieldValue(
  customData: Record<string, unknown>,
  field: FormField
): string {
  // Try multiple key formats (field ID, label, lowercase label)
  const possibleKeys = [
    field.id,
    field.label,
    field.label.toLowerCase(),
    field.label.toLowerCase().replace(/\s+/g, "_"),
    field.label.replace(/\s+/g, "_"),
  ];

  let value: unknown = undefined;
  
  for (const key of possibleKeys) {
    if (key in customData) {
      value = customData[key];
      break;
    }
  }

  if (value === undefined || value === null) {
    return "";
  }

  // Handle different field types
  switch (field.field_type) {
    case "checkbox":
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return value === true ? "Yes" : value === false ? "No" : String(value);

    case "file":
      if (typeof value === "string" && value.startsWith("http")) {
        return value; // Return file URL
      }
      if (Array.isArray(value)) {
        return value.join(", ");
      }
      return String(value || "");

    case "select":
    case "radio":
      // Try to get the label from options if value is a key
      if (field.options && Array.isArray(field.options)) {
        const option = field.options.find(
          (opt) => opt.value === value || opt.label === value
        );
        if (option) {
          return option.label;
        }
      }
      return String(value);

    case "date":
      if (value instanceof Date) {
        return value.toLocaleDateString();
      }
      if (typeof value === "string") {
        try {
          return new Date(value).toLocaleDateString();
        } catch {
          return value;
        }
      }
      return String(value);

    case "datetime":
      if (value instanceof Date) {
        return value.toLocaleString();
      }
      if (typeof value === "string") {
        try {
          return new Date(value).toLocaleString();
        } catch {
          return value;
        }
      }
      return String(value);

    default:
      if (typeof value === "object") {
        return JSON.stringify(value);
      }
      return String(value);
  }
}

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

// Validate that the sheet is accessible with proper permissions
async function validateSheetAccess(
  accessToken: string, 
  spreadsheetId: string, 
  serviceAccountEmail: string
): Promise<{ accessible: boolean; error?: string; hint?: string; firstSheetName?: string; allSheetNames?: string[] }> {
  try {
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || "Unknown error";
      const errorCode = errorData.error?.code || response.status;

      console.error(`Sheet access validation failed: ${errorCode} - ${errorMessage}`);

      // Handle specific error codes with helpful messages
      if (errorCode === 404) {
        return {
          accessible: false,
          error: "Spreadsheet not found",
          hint: "The spreadsheet URL may be incorrect or the spreadsheet has been deleted. Please check the URL and try again."
        };
      }

      if (errorCode === 403) {
        return {
          accessible: false,
          error: "Access denied to spreadsheet",
          hint: `The spreadsheet is not shared with the service account. Please share your Google Sheet with this email address as an Editor: ${serviceAccountEmail}`
        };
      }

      return {
        accessible: false,
        error: `Cannot access spreadsheet: ${errorMessage}`,
        hint: `Please ensure the spreadsheet is shared with: ${serviceAccountEmail}`
      };
    }

    const data = await response.json();
    const allSheetNames = data.sheets?.map((s: { properties: { title: string } }) => s.properties.title) || [];
    const firstSheetName = allSheetNames[0] || "Sheet1";
    
    console.log(`Sheet access validated successfully. Available sheets: ${allSheetNames.join(", ")}`);
    
    return { accessible: true, firstSheetName, allSheetNames };
  } catch (error) {
    console.error("Sheet validation error:", error);
    return {
      accessible: false,
      error: "Failed to validate sheet access",
      hint: `Please check that the spreadsheet URL is correct and shared with: ${serviceAccountEmail}`
    };
  }
}

// Get the first sheet name from the spreadsheet (fallback function)
async function getFirstSheetName(accessToken: string, spreadsheetId: string): Promise<string> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=sheets.properties.title`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Failed to get sheet info: ${error.error?.message || "Unknown error"}`);
  }

  const data = await response.json();
  if (data.sheets && data.sheets.length > 0) {
    return data.sheets[0].properties.title;
  }
  return "Sheet1"; // Default fallback
}

async function clearSheet(accessToken: string, spreadsheetId: string, sheetName: string) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}:clear`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );
  
  // Ignore errors on clear - sheet might be empty
  if (!response.ok) {
    console.log(`Clear sheet warning (continuing anyway): ${response.status}`);
  }
}

async function updateSheet(accessToken: string, spreadsheetId: string, sheetName: string, data: string[][]) {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(sheetName)}!A1?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
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
