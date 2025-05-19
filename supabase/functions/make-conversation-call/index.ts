
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Function to format phone number to international format (similar to make-call)
function formatPhoneNumber(phoneNumber: string): string {
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  if (cleaned.length === 11 || cleaned.length === 10) {
    if (!phoneNumber.startsWith('+')) {
      if (cleaned.startsWith('55')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+55' + cleaned;
      }
    }
  } else {
    if (!phoneNumber.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
  }
  
  console.log(`Original number: ${phoneNumber}, Formatted: ${cleaned}`);
  return cleaned;
}

// Helper function to get Twilio client
async function getTwilioClient(accountSid: string, authToken: string) {
  try {
    const twilio = await import("npm:twilio@4.20.0");
    return new twilio.default(accountSid, authToken);
  } catch (error) {
    console.error("Error initializing Twilio client:", error);
    throw new Error(`Failed to initialize Twilio client: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get Twilio credentials from environment
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhone) {
      throw new Error("Twilio credentials are not properly configured");
    }
    
    // Extract parameters from request
    const { phoneNumber, agentId, campaignId, leadId } = await req.json();
    
    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }
    
    console.log(`Making conversation call to ${phoneNumber}`);
    console.log(`Agent: ${agentId}, Campaign: ${campaignId}, Lead: ${leadId}`);
    
    // Format phone number
    const formattedPhone = formatPhoneNumber(phoneNumber);
    
    // Create Twilio client
    const client = await getTwilioClient(twilioAccountSid, twilioAuthToken);
    
    // Get base URL for functions
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const functionUrl = `${supabaseUrl}/functions/v1/conversation-relay-handler`;
    const statusCallbackUrl = `${supabaseUrl}/functions/v1/call-status`;
    
    console.log(`Using function URL: ${functionUrl}`);
    
    // Prepare call parameters
    const callParams = {
      to: formattedPhone,
      from: twilioPhone,
      url: functionUrl,
      method: 'POST',
      statusCallback: statusCallbackUrl,
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
      statusCallbackMethod: 'POST',
      timeout: 30,
      machineDetection: 'DetectMessageEnd',
    };
    
    // Add additional parameters to pass to TwiML
    if (agentId) callParams.agentId = agentId;
    if (campaignId) callParams.campaignId = campaignId;
    if (leadId) callParams.leadId = leadId;
    
    console.log("Calling Twilio API with params:", callParams);
    
    // Make the call
    const call = await client.calls.create(callParams);
    
    console.log(`Call initiated with SID: ${call.sid}, Status: ${call.status}`);
    
    // Update lead status if leadId is provided
    if (leadId) {
      try {
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          await supabase
            .from("leads")
            .update({ 
              status: "called",
              call_result: "Conversation call started"
            })
            .eq("id", leadId);
            
          console.log(`Updated lead ${leadId} status to 'called'`);
        }
      } catch (dbErr) {
        console.error("Error updating lead status:", dbErr);
        // Don't fail if this update fails
      }
    }
    
    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        callSid: call.sid,
        status: call.status
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in make-conversation-call:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Internal server error" 
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
