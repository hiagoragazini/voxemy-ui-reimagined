
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const WEBSOCKET_URL = Deno.env.get("WEBSOCKET_URL") || "";
const TWILIO_ACCOUNT_SID = Deno.env.get("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = Deno.env.get("TWILIO_AUTH_TOKEN");
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const formData = await req.formData();
    
    // Extract parameters
    const callSid = formData.get("CallSid");
    const to = formData.get("To");
    const from = formData.get("From");
    const agentId = formData.get("agentId");
    const campaignId = formData.get("campaignId");
    const leadId = formData.get("leadId");

    console.log(`🚀 ConversationRelay handler - Protocol Correto`);
    console.log(`📞 CallSid: ${callSid}, De: ${from}, Para: ${to}`);
    console.log(`🎙️ ElevenLabs: ${ELEVENLABS_API_KEY ? 'ATIVO' : 'INATIVO'}`);
    
    // Configurar URL do WebSocket
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    let wsUrl = "";
    
    if (supabaseUrl) {
      const baseUrl = supabaseUrl.replace("https://", "");
      wsUrl = `wss://${baseUrl}/functions/v1/ai-websocket-server`;
      console.log(`🔗 WebSocket URL: ${wsUrl}`);
    } else if (WEBSOCKET_URL) {
      wsUrl = WEBSOCKET_URL;
      if (wsUrl.startsWith("https://")) {
        wsUrl = wsUrl.replace("https://", "wss://");
      } else if (!wsUrl.startsWith("wss://")) {
        wsUrl = `wss://${wsUrl.replace(/^(http:\/\/|ws:\/\/)?/, "")}`;
      }
      console.log(`🔗 Usando WEBSOCKET_URL: ${wsUrl}`);
    } else {
      console.error("❌ URL WebSocket não configurada");
      return new Response(
        "Error: WebSocket URL não configurada",
        { status: 500, headers: corsHeaders }
      );
    }
    
    // Adicionar parâmetros à URL do WebSocket
    if (agentId || campaignId || leadId || callSid) {
      const params = new URLSearchParams();
      if (agentId) params.append("agentId", agentId.toString());
      if (campaignId) params.append("campaignId", campaignId.toString());
      if (leadId) params.append("leadId", leadId.toString());
      if (callSid) params.append("callSid", callSid.toString());
      
      wsUrl += `?${params.toString()}`;
    }

    console.log(`🎯 URL WebSocket final: ${wsUrl}`);

    // Registrar chamada no banco de dados
    if (callSid) {
      try {
        const supabaseUrl = Deno.env.get("SUPABASE_URL");
        const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
        
        if (supabaseUrl && supabaseServiceKey) {
          const supabase = createClient(supabaseUrl, supabaseServiceKey);
          
          const { data: existingCall } = await supabase
            .from("call_logs")
            .select("id")
            .eq("call_sid", callSid)
            .maybeSingle();
            
          if (!existingCall) {
            await supabase
              .from("call_logs")
              .insert({
                call_sid: callSid.toString(),
                status: "conversation_active",
                from_number: from?.toString(),
                to_number: to?.toString(),
                agent_id: agentId?.toString(),
                campaign_id: campaignId?.toString(),
                lead_id: leadId?.toString(),
                conversation_relay_active: true
              });
              
            console.log(`📝 Call log criado - ConversationRelay Protocol ativo`);
          } else {
            // Atualizar para indicar que ConversationRelay está ativo
            await supabase
              .from("call_logs")
              .update({
                conversation_relay_active: true,
                status: "conversation_active"
              })
              .eq("call_sid", callSid);
              
            console.log(`📝 Call log atualizado - ConversationRelay Protocol ativo`);
          }
        }
      } catch (dbError) {
        console.error("❌ Erro registrando no banco:", dbError);
      }
    }

    // TwiML otimizado para ConversationRelay Protocol
    console.log("🎙️ Gerando TwiML com ConversationRelay Protocol correto");
    
    const twimlContent = `<ConversationRelay 
      url="${wsUrl}" 
      transcriptionEnabled="true"
      transcriptionLanguage="pt-BR"
      detectSpeechTimeout="2"
      interruptByDtmf="true"
      dtmfInputs="#,*"
    />`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    ${twimlContent}
  </Connect>
</Response>`;

    console.log(`✅ TwiML gerado com ConversationRelay Protocol`);
    console.log(`🔊 Configurações: PT-BR, timeout 2s, DTMF interrupt`);
    console.log(`🧠 WebSocket server implementa protocolo correto do Twilio`);

    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/xml",
      },
    });
  } catch (error) {
    console.error("❌ Erro no conversation-relay-handler:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
