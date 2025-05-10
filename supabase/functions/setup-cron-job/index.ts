
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Credenciais do Supabase não estão configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request data
    const { 
      interval = "* * * * *", // Default to every minute
      functionName = "campaign-executor",
      maxCalls = 5
    } = await req.json();

    // Check if we have the pg_net and pg_cron extensions enabled
    const { data: extensions, error: extensionsError } = await supabase.rpc(
      'check_extensions',
      { extension_names: ['pg_cron', 'pg_net'] }
    );
    
    if (extensionsError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to check extensions: " + extensionsError.message,
          details: "You need to enable pg_cron and pg_net extensions in your Supabase project."
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }
    
    if (!extensions || !extensions.every((ext: any) => ext.installed)) {
      const missing = extensions.filter((ext: any) => !ext.installed).map((ext: any) => ext.name);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Required extensions are not enabled: " + missing.join(", "),
          details: "Please enable these extensions in your Supabase dashboard."
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    // Set up the cron job
    const { data: cronJobResult, error: cronJobError } = await supabase.rpc(
      'setup_campaign_executor_cron',
      { 
        schedule_interval: interval,
        max_calls: maxCalls,
        function_url: `${supabaseUrl}/functions/v1/${functionName}`,
        auth_token: supabaseServiceKey
      }
    );

    if (cronJobError) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to set up cron job: " + cronJobError.message
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, "Content-Type": "application/json" } 
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "CRON job set up successfully",
        details: cronJobResult
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error setting up cron job:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error"
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
