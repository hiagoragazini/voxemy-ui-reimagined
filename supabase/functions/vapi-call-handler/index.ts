
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Vapi API Settings
const VAPI_API_KEY = Deno.env.get("VAPI_API_KEY") || "";
const VAPI_API_URL = "https://api.vapi.ai/call";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("\n=== VAPI-CALL-HANDLER ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    // Extract request data
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData, null, 2));
    
    const { 
      phoneNumber, 
      message, 
      agentId, 
      campaignId, 
      leadId,
      voiceId
    } = requestData;
    
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    if (!message) {
      throw new Error("Message is required");
    }

    if (!VAPI_API_KEY) {
      throw new Error("VAPI_API_KEY is not configured");
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get callback URL for status updates
    const callbackUrl = `${supabaseUrl}/functions/v1/call-status`;
    
    // Clean phone number (remove non-digit characters)
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    
    // Create the VAPI call payload
    const callPayload = {
      recipient: {
        phone_number: "+"+cleanPhone,
      },
      first_message: {
        text: message
      },
      voice: {
        provider: "11labs",
        voice_id: voiceId || "FGY2WhTYpPnrIDTdsKH5" // Default is Laura (Portuguese)
      },
      phone_number: "+12568344278", // Your VAPI AI number
      status_callback_url: callbackUrl,
      metadata: {
        agentId,
        campaignId,
        leadId
      }
    };
    
    console.log("VAPI call payload:", JSON.stringify(callPayload, null, 2));
    
    // Call VAPI API
    const response = await fetch(VAPI_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${VAPI_API_KEY}`
      },
      body: JSON.stringify(callPayload),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error("VAPI API error:", errorData);
      throw new Error(`VAPI API error: ${JSON.stringify(errorData)}`);
    }
    
    const result = await response.json();
    console.log("VAPI API response:", result);
    
    // Create call log entry
    if (result.call_id) {
      const { data: callLog, error: logError } = await supabase
        .from("call_logs")
        .insert({
          call_sid: result.call_id,
          agent_id: agentId,
          campaign_id: campaignId,
          lead_id: leadId,
          phone_number: cleanPhone,
          status: "initiated",
          provider: "vapi",
          recorded_at: new Date().toISOString(),
          initial_message: message
        })
        .select();
        
      if (logError) {
        console.error("Error logging call:", logError);
      } else {
        console.log("Call logged successfully:", callLog);
      }
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        callId: result.call_id,
        message: "Call initiated successfully",
        details: result
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in vapi-call-handler:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
