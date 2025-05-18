
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
    // Process only POST requests
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Method not allowed" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[ERROR] call-status: Supabase credentials not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Detect if it's a Vapi or Twilio callback based on the content type
    const contentType = req.headers.get("content-type") || "";
    
    if (contentType.includes("application/json")) {
      // Handle Vapi callback (JSON format)
      return await handleVapiCallback(req, supabase);
    } else {
      // Handle Twilio callback (form data format)
      return await handleTwilioCallback(req, supabase);
    }
    
  } catch (error) {
    console.error(`[ERROR] call-status: Error processing status: ${error}`);
    
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error.message || "Unknown processing error" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});

/**
 * Handle Vapi webhook callbacks (JSON format)
 */
async function handleVapiCallback(req, supabase) {
  try {
    const vapiData = await req.json();
    console.log("[DEBUG] Vapi callback data:", JSON.stringify(vapiData, null, 2));
    
    // Extract important call information from Vapi payload
    const callSid = vapiData.call_id;
    const callStatus = mapVapiStatusToStandard(vapiData.status);
    
    // Extract metadata if available
    const metadata = vapiData.metadata || {};
    const agentId = metadata.agentId;
    const campaignId = metadata.campaignId;
    const leadId = metadata.leadId;
    
    if (!callSid) {
      console.error("[ERROR] Vapi callback missing call_id");
      return new Response(
        JSON.stringify({ error: "Missing call_id in Vapi callback" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    console.log(`[DEBUG] Processing Vapi call ${callSid} with status: ${callStatus}`);
    
    // Update call record in database
    await updateCallRecord(supabase, {
      callSid,
      status: callStatus,
      agentId,
      campaignId,
      leadId,
      duration: vapiData.duration, // Vapi provides duration in seconds
      recordingUrl: vapiData.recording_url,
      provider: "vapi"
    });
    
    // If call is completed, update lead status if we have a lead ID
    if (callStatus === "completed" && leadId) {
      await updateLeadStatus(supabase, leadId, "completed");
    }
    
    // If call failed, update lead status if we have a lead ID
    if (["failed", "busy", "no-answer"].includes(callStatus) && leadId) {
      await updateLeadStatus(supabase, leadId, "failed", "Call " + callStatus);
    }
    
    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Vapi call status processed: ${callStatus}`,
        callSid
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ERROR] Processing Vapi callback:", error);
    return new Response(
      JSON.stringify({ error: "Error processing Vapi callback: " + error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}

/**
 * Handle Twilio webhook callbacks (form data format)
 */
async function handleTwilioCallback(req, supabase) {
  try {
    // Load form data
    const formData = await req.formData();
    
    // Extract values
    const callSid = formData.get("CallSid");
    const callStatus = formData.get("CallStatus");
    const from = formData.get("From");
    const to = formData.get("To");
    const callDuration = formData.get("CallDuration");
    
    console.log(`[DEBUG] Processing Twilio call ${callSid} with status: ${callStatus}`);
    
    if (!callSid) {
      console.error("[ERROR] Twilio callback missing CallSid");
      return new Response(
        JSON.stringify({ error: "CallSid not provided" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Update call record
    await updateCallRecord(supabase, {
      callSid,
      status: callStatus,
      from,
      to,
      duration: callDuration ? parseInt(callDuration.toString(), 10) : null,
      provider: "twilio"
    });
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Twilio call status updated to ${callStatus}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[ERROR] Processing Twilio callback:", error);
    return new Response(
      JSON.stringify({ error: "Error processing Twilio callback: " + error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
}

/**
 * Update call record in database
 */
async function updateCallRecord(supabase, {
  callSid, 
  status, 
  agentId = null,
  campaignId = null,
  leadId = null,
  from = null, 
  to = null, 
  duration = null,
  recordingUrl = null,
  provider = "unknown"
}) {
  // Check if call record exists
  const { data: existingCall, error: fetchError } = await supabase
    .from("call_logs")
    .select("id, status, agent_id, campaign_id, lead_id")
    .eq("call_sid", callSid)
    .maybeSingle();
  
  if (fetchError) {
    console.error(`[ERROR] Error fetching call record: ${fetchError.message}`);
    return;
  }
  
  const updateData = { status };
  
  // Add optional fields if provided
  if (duration !== null) updateData.duration = duration;
  if (recordingUrl) updateData.recording_url = recordingUrl;
  
  // If the call exists, update it
  if (existingCall) {
    // Merge agentId, campaignId, leadId if they're not already set but are provided now
    if (agentId && !existingCall.agent_id) updateData.agent_id = agentId;
    if (campaignId && !existingCall.campaign_id) updateData.campaign_id = campaignId;
    if (leadId && !existingCall.lead_id) updateData.lead_id = leadId;
    
    const { error: updateError } = await supabase
      .from("call_logs")
      .update(updateData)
      .eq("call_sid", callSid);
    
    if (updateError) {
      console.error(`[ERROR] Error updating call status: ${updateError.message}`);
    } else {
      console.log(`[DEBUG] Call status updated to "${status}"`);
    }
  } else {
    // If the call doesn't exist, create a new record
    const newCall = {
      call_sid: callSid,
      status,
      agent_id: agentId,
      campaign_id: campaignId,
      lead_id: leadId,
      from_number: from,
      to_number: to,
      duration,
      recording_url: recordingUrl,
      provider
    };
    
    const { error: insertError } = await supabase
      .from("call_logs")
      .insert(newCall);
    
    if (insertError) {
      console.error(`[ERROR] Error inserting call record: ${insertError.message}`);
    } else {
      console.log(`[DEBUG] New call record created for SID ${callSid}`);
    }
  }
}

/**
 * Update lead status in database
 */
async function updateLeadStatus(supabase, leadId, status, callResult = null) {
  if (!leadId) return;
  
  const updateData = { status };
  if (callResult) updateData.call_result = callResult;
  
  const { error } = await supabase
    .from("leads")
    .update(updateData)
    .eq("id", leadId);
  
  if (error) {
    console.error(`[ERROR] Error updating lead status: ${error.message}`);
  } else {
    console.log(`[DEBUG] Lead ${leadId} status updated to "${status}"`);
  }
}

/**
 * Map Vapi status to standard status
 */
function mapVapiStatusToStandard(vapiStatus) {
  // Convert Vapi status to standardized status format
  // This helps with consistency across different providers
  switch (vapiStatus) {
    case "initiated":
      return "initiated";
    case "ringing":
      return "ringing";
    case "in-progress":
      return "in-progress";
    case "completed":
      return "completed";
    case "busy":
      return "busy";
    case "no-answer":
      return "no-answer";
    case "failed":
      return "failed";
    case "canceled":
      return "canceled";
    default:
      return vapiStatus;
  }
}
