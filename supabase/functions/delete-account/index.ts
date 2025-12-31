import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const logs: string[] = [];
  const log = (message: string) => {
    console.log(message);
    logs.push(message);
  };

  try {
    log("Starting account deletion process");
    
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      log("ERROR: Missing authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header", logs }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user's token to get their ID
    log("Verifying user token");
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    
    if (userError || !user) {
      log(`ERROR: Invalid token - ${userError?.message || 'No user found'}`);
      return new Response(
        JSON.stringify({ error: "Invalid or expired token", logs }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log(`User verified: ${user.id} (${user.email})`);

    // Use service role client for deletion operations
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Step 1: Delete all user data using the database function
    log("Step 1: Deleting user data via permanently_delete_user function");
    const { data: deleteResult, error: deleteDataError } = await adminClient.rpc("permanently_delete_user", {
      target_user_id: user.id,
    });

    if (deleteDataError) {
      log(`ERROR in permanently_delete_user: ${deleteDataError.message}`);
      log(`Error details: ${JSON.stringify(deleteDataError)}`);
      return new Response(
        JSON.stringify({ 
          error: "Failed to delete user data", 
          details: deleteDataError.message,
          logs 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log(`User data deletion result: ${JSON.stringify(deleteResult)}`);

    // Step 2: Sign out all sessions for this user
    log("Step 2: Signing out all user sessions");
    try {
      await adminClient.auth.admin.signOut(user.id, 'global');
      log("All sessions signed out successfully");
    } catch (signOutError: any) {
      // This is non-critical, continue with deletion
      log(`Warning: Could not sign out sessions - ${signOutError?.message || 'Unknown error'}`);
    }

    // Step 3: Delete the auth user using admin API
    log("Step 3: Deleting auth user record");
    const { error: authDeleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (authDeleteError) {
      log(`ERROR deleting auth user: ${authDeleteError.message}`);
      return new Response(
        JSON.stringify({ 
          error: "Failed to delete authentication record", 
          details: authDeleteError.message,
          logs 
        }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    log("Auth user deleted successfully");
    log("Account deletion completed successfully");

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Account permanently deleted",
        logs 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("Delete account error:", error);
    return new Response(
      JSON.stringify({ 
        error: "Internal server error", 
        details: error?.message || 'Unknown error',
        logs 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
