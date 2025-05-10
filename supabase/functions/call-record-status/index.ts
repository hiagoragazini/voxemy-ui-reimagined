
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

    // Extract recording data from request
    const formData = await req.formData();
    const callSid = formData.get("CallSid")?.toString() || "";
    const recordingSid = formData.get("RecordingSid")?.toString() || "";
    const recordingUrl = formData.get("RecordingUrl")?.toString() || "";
    const recordingStatus = formData.get("RecordingStatus")?.toString() || "";
    const recordingDuration = formData.get("RecordingDuration")?.toString() || "0";
    
    // Additional parameters from the original call
    const agentId = formData.get("agentId")?.toString();
    const campaignId = formData.get("campaignId")?.toString();
    const leadId = formData.get("leadId")?.toString();

    console.log(`Call recording status update: ${callSid}, status: ${recordingStatus}, duration: ${recordingDuration}s`);
    
    if (recordingStatus === "completed" && recordingUrl) {
      // Store recording information in the database
      const { data, error } = await supabase
        .from("call_recordings")
        .insert({
          call_sid: callSid,
          recording_sid: recordingSid,
          recording_url: recordingUrl,
          duration_seconds: parseInt(recordingDuration, 10),
          agent_id: agentId,
          campaign_id: campaignId,
          lead_id: leadId,
          processed_at: new Date().toISOString()
        });

      if (error) {
        console.error("Error storing call recording:", error);
      } else {
        console.log("Call recording stored successfully");

        // If a leadId was provided, update the lead with recording information
        if (leadId) {
          await supabase
            .from("leads")
            .update({
              recording_url: recordingUrl,
              recording_sid: recordingSid,
              call_duration: formatDuration(parseInt(recordingDuration, 10))
            })
            .eq("id", leadId);
        }
      }
    }

    return new Response(
      null,
      { 
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Error processing recording status:", error);
    
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

// Helper function to format seconds into MM:SS format
function formatDuration(durationSeconds: number): string {
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}
