
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Media server connection settings
const MEDIA_SERVER_URL = Deno.env.get("MEDIA_SERVER_URL") || "http://localhost:8021";
const MEDIA_SERVER_PASSWORD = Deno.env.get("MEDIA_SERVER_PASSWORD") || "";

// Helper function to terminate a call on the media server
async function terminateMediaServerCall(callId: string) {
  try {
    console.log(`Encerrando chamada ${callId} no servidor de mídia`);
    
    // In a real implementation, this would make an API call to FreeSWITCH/Asterisk
    // to terminate an active call
    
    // Simulate a successful call termination
    return {
      callId,
      status: "terminated",
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error(`Erro ao encerrar chamada ${callId} no servidor de mídia:`, error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("\n=== VOICEBOT-TERMINATE HANDLER ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Method: ${req.method}`);
    
    // Extract request data
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData, null, 2));
    
    const { callId } = requestData;
    
    if (!callId) {
      throw new Error("ID da chamada não fornecido");
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Credenciais Supabase não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Terminate the call on the media server
    const terminationResult = await terminateMediaServerCall(callId);
    
    // Update the call status in the database
    const { data: updatedCall, error: updateError } = await supabase
      .from("call_logs")
      .update({
        status: "completed",
        end_time: new Date().toISOString()
      })
      .eq("call_sid", callId)
      .select();
      
    if (updateError) {
      console.error("Erro ao atualizar estado da chamada no banco de dados:", updateError);
    } else {
      console.log("Estado da chamada atualizado no banco de dados:", updatedCall);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        callId: callId,
        status: "completed",
        message: "Chamada encerrada com sucesso"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Erro na função voicebot-terminate:", error);
    
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
