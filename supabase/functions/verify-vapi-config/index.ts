
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for required API keys
    const vapiApiKey = Deno.env.get("VAPI_API_KEY");
    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    
    const configStatus = {
      success: true,
      vapi: {
        configured: Boolean(vapiApiKey),
        keyLength: vapiApiKey ? vapiApiKey.length : 0,
        status: vapiApiKey ? "Key present" : "Key missing"
      },
      elevenlabs: {
        configured: Boolean(elevenlabsApiKey),
        keyLength: elevenlabsApiKey ? elevenlabsApiKey.length : 0,
        status: elevenlabsApiKey ? "Key present" : "Key missing"
      },
      timestamp: new Date().toISOString()
    };
    
    // Verify Vapi API key by making a simple request
    if (vapiApiKey) {
      try {
        const vapiResponse = await fetch("https://api.vapi.ai/models", {
          headers: {
            "Authorization": `Bearer ${vapiApiKey}`,
            "Content-Type": "application/json"
          }
        });
        
        configStatus.vapi.responseStatus = vapiResponse.status;
        configStatus.vapi.valid = vapiResponse.ok;
        
        if (vapiResponse.ok) {
          configStatus.vapi.status = "Key valid and working";
        } else {
          configStatus.vapi.status = `Invalid key (Status: ${vapiResponse.status})`;
        }
      } catch (vapiError) {
        configStatus.vapi.valid = false;
        configStatus.vapi.status = `Error validating: ${vapiError.message}`;
      }
    }
    
    // Return configuration status
    return new Response(
      JSON.stringify(configStatus),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
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
