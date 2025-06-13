
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const EXTERNAL_WEBSOCKET_URL = Deno.env.get("EXTERNAL_WEBSOCKET_URL") || "";
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
    
    // Extract parameters
    const callSid = formData.get("CallSid");
    const to = formData.get("To");
    const from = formData.get("From");
    const agentId = formData.get("agentId");
    const campaignId = formData.get("campaignId");
    const leadId = formData.get("leadId");

    console.log(`🚀 ConversationRelay handler - CORRIGIDO (verify_jwt = false)`);
    console.log(`📞 CallSid: ${callSid}, De: ${from}, Para: ${to}`);
    console.log(`🔧 Servidor Externo: ${EXTERNAL_WEBSOCKET_URL ? 'CONFIGURADO' : 'NÃO CONFIGURADO'}`);
    
    // Configurar URL do WebSocket com prioridade para servidor externo
    let wsUrl = "";
    
    if (EXTERNAL_WEBSOCKET_URL) {
      // Usar servidor WebSocket externo (Railway)
      wsUrl = EXTERNAL_WEBSOCKET_URL;
      
      // Converter HTTP para WebSocket URL se necessário
      if (wsUrl.startsWith("https://")) {
        wsUrl = wsUrl.replace("https://", "wss://");
      } else if (wsUrl.startsWith("http://")) {
        wsUrl = wsUrl.replace("http://", "ws://");
      } else if (!wsUrl.startsWith("wss://") && !wsUrl.startsWith("ws://")) {
        wsUrl = `wss://${wsUrl}`;
      }
      
      // Remover trailing slash e adicionar path se necessário
      wsUrl = wsUrl.replace(/\/$/, "");
      
      console.log(`✅ Usando servidor WebSocket externo: ${wsUrl}`);
    } else if (WEBSOCKET_URL) {
      // Fallback para WEBSOCKET_URL
      wsUrl = WEBSOCKET_URL;
      if (wsUrl.startsWith("https://")) {
        wsUrl = wsUrl.replace("https://", "wss://");
      } else if (!wsUrl.startsWith("wss://")) {
        wsUrl = `wss://${wsUrl.replace(/^(http:\/\/|ws:\/\/)?/, "")}`;
      }
      console.log(`⚠️ Usando WEBSOCKET_URL fallback: ${wsUrl}`);
    } else {
      // Último recurso: Supabase Edge Function
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      if (supabaseUrl) {
        const baseUrl = supabaseUrl.replace("https://", "");
        wsUrl = `wss://${baseUrl}/functions/v1/ai-websocket-server`;
        console.log(`🆘 Usando Supabase WebSocket (último recurso): ${wsUrl}`);
      } else {
        console.error("❌ ERRO CRÍTICO: Nenhuma URL WebSocket configurada");
        return new Response(
          "Error: WebSocket URL não configurada. Configure EXTERNAL_WEBSOCKET_URL.",
          { status: 500, headers: corsHeaders }
        );
      }
    }
    
    // Adicionar parâmetros à URL do WebSocket
    if (agentId || campaignId || leadId || callSid) {
      const params = new URLSearchParams();
      if (agentId) params.append("agentId", agentId.toString());
      if (campaignId) params.append("campaignId", campaignId.toString());
      if (leadId) params.append("leadId", leadId.toString());
      if (callSid) params.append("callSid", callSid.toString());
      
      const separator = wsUrl.includes('?') ? '&' : '?';
      wsUrl += `${separator}${params.toString()}`;
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
                conversation_relay_active: true,
                websocket_url: wsUrl,
                conversation_log: JSON.stringify({
                  event: "relay_handler_called",
                  timestamp: new Date().toISOString(),
                  external_websocket: !!EXTERNAL_WEBSOCKET_URL,
                  websocket_url: wsUrl
                })
              });
              
            console.log(`📝 Call log criado - Servidor: ${EXTERNAL_WEBSOCKET_URL ? 'EXTERNO (Railway)' : 'INTERNO (Supabase)'}`);
          } else {
            // Atualizar para indicar que ConversationRelay está ativo
            await supabase
              .from("call_logs")
              .update({
                conversation_relay_active: true,
                status: "conversation_active",
                websocket_url: wsUrl,
                conversation_log: JSON.stringify({
                  event: "relay_handler_updated",
                  timestamp: new Date().toISOString(),
                  external_websocket: !!EXTERNAL_WEBSOCKET_URL,
                  websocket_url: wsUrl
                })
              })
              .eq("call_sid", callSid);
              
            console.log(`📝 Call log atualizado - Servidor: ${EXTERNAL_WEBSOCKET_URL ? 'EXTERNO (Railway)' : 'INTERNO (Supabase)'}`);
          }
        }
      } catch (dbError) {
        console.error("❌ Erro registrando no banco:", dbError);
      }
    }

    // TwiML otimizado para ConversationRelay Protocol
    console.log("🎙️ Gerando TwiML com ConversationRelay Protocol - VOZES NATIVAS");
    
    const twimlContent = `<ConversationRelay 
      url="${wsUrl}" 
      transcriptionEnabled="true"
      transcriptionLanguage="pt-BR"
      detectSpeechTimeout="3"
      interruptByDtmf="true"
      dtmfInputs="#,*"
    />`;

    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    ${twimlContent}
  </Connect>
</Response>`;

    console.log(`✅ TwiML gerado com ConversationRelay Protocol - AUTENTICAÇÃO CORRIGIDA`);
    console.log(`🔊 Configurações: PT-BR, timeout 3s, DTMF interrupt`);
    console.log(`🌐 Servidor WebSocket: ${EXTERNAL_WEBSOCKET_URL ? 'RAILWAY (DEDICADO)' : 'SUPABASE (FALLBACK)'}`);
    console.log(`🔓 Autenticação JWT: DESABILITADA (verify_jwt = false)`);

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
