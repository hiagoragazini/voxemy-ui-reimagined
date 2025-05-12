
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
    
    // Get request parameters
    const { 
      schedule = "*/10 9-18 * * 1-5", // Default: Every 10 minutes from 9 AM to 6 PM, Monday to Friday
      maxCallsPerRun = 5,
      enabled = true
    } = await req.json();

    console.log(`Configurando cron job com schedule: ${schedule}, maxCallsPerRun: ${maxCallsPerRun}`);

    // Check if pg_cron and pg_net extensions are available
    const { data: extensions, error: extensionsError } = await supabase.rpc(
      'check_extensions',
      { extension_names: ['pg_cron', 'pg_net'] }
    );
    
    if (extensionsError) {
      console.error("Erro ao verificar extensões:", extensionsError);
      throw new Error(`Erro ao verificar extensões: ${extensionsError.message}`);
    }
    
    const missingExtensions = extensions.filter(ext => !ext.installed).map(ext => ext.name);
    
    if (missingExtensions.length > 0) {
      throw new Error(`As seguintes extensões precisam ser habilitadas: ${missingExtensions.join(', ')}`);
    }
    
    // Get URL for the campaign-executor function
    const functionUrl = `${supabaseUrl}/functions/v1/campaign-executor`;
    
    // If enabled, set up the cron job
    let result;
    
    if (enabled) {
      // Define cron job parameters
      const jobName = 'campaign_executor_job';
      
      result = await supabase.rpc(
        'setup_campaign_executor_cron',
        {
          schedule_interval: schedule,
          max_calls: maxCallsPerRun,
          function_url: functionUrl,
          auth_token: supabaseServiceKey
        }
      );
    } else {
      // Remove the cron job if it exists
      const { data, error } = await supabase.query(`
        SELECT cron.unschedule('campaign_executor_job') AS result;
      `);
      
      result = data ? "Cron job desativado com sucesso" : "Falha ao desativar cron job";
      
      if (error) {
        console.error("Erro ao desativar cron job:", error);
        throw new Error(`Erro ao desativar cron job: ${error.message}`);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        message: enabled ? "Cron job configurado com sucesso" : "Cron job desativado com sucesso",
        result,
        schedule,
        maxCallsPerRun,
        enabled
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Erro ao configurar cron job:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro desconhecido",
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});
