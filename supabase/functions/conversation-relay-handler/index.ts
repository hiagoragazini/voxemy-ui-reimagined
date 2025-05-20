
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const WEBSOCKET_URL = Deno.env.get("WEBSOCKET_URL") || "";
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const formData = await req.formData();
    
    // Extract parameters (callSid, agentId, campaignId, etc.)
    const callSid = formData.get("CallSid");
    const to = formData.get("To");
    const from = formData.get("From");
    const agentId = formData.get("agentId");
    const campaignId = formData.get("campaignId");
    const leadId = formData.get("leadId");

    console.log(`ConversationRelay handler called for call ${callSid}`);
    console.log(`From: ${from} To: ${to} AgentId: ${agentId} LeadId: ${leadId}`);
    
    // Verify WEBSOCKET_URL is configured
    if (!WEBSOCKET_URL) {
      console.error("WEBSOCKET_URL is not configured");
      return new Response(
        "Error: WebSocket URL is not configured",
        { status: 500, headers: corsHeaders }
      );
    }

    // Create websocket URL with parameters
    let wsUrl = WEBSOCKET_URL;
    
    // Append query parameters
    if (agentId || campaignId || leadId) {
      const params = new URLSearchParams();
      if (agentId) params.append("agentId", agentId.toString());
      if (campaignId) params.append("campaignId", campaignId.toString());
      if (leadId) params.append("leadId", leadId.toString());
      if (callSid) params.append("callSid", callSid.toString());
      
      wsUrl += `?${params.toString()}`;
    }

    // Add record to the database if we have a callSid
    if (callSid) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          // Check if there's already a call record
          const { data: existingCall } = await supabase
            .from("call_logs")
            .select("id")
            .eq("call_sid", callSid)
            .maybeSingle();
            
          if (!existingCall) {
            // Create call log record
            await supabase
              .from("call_logs")
              .insert({
                call_sid: callSid.toString(),
                status: "initiated",
                from_number: from?.toString(),
                to_number: to?.toString(),
                agent_id: agentId?.toString(),
                campaign_id: campaignId?.toString(),
                lead_id: leadId?.toString(),
                conversation_relay_active: true
              });
              
            console.log(`Created call log for call ${callSid} with ConversationRelay active`);
          } else {
            console.log(`Call log already exists for call ${callSid}`);
          }
        }
      } catch (dbError) {
        console.error("Error recording call to database:", dbError);
        // Don't fail the response if DB recording fails
      }
    }

    // Generate TwiML with ConversationRelay
    const welcomeGreeting = "Olá! Sou o assistente da Voxemy. Como posso ajudar você hoje?";
    
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <ConversationRelay 
      url="${wsUrl}" 
      welcomeGreeting="${welcomeGreeting}"
      transcriptionEnabled="true"
      transcriptionLanguage="pt-BR"
    />
  </Connect>
</Response>`;

    console.log(`Generated TwiML with ConversationRelay using WebSocket URL: ${wsUrl}`);

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("Error in conversation-relay-handler:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
