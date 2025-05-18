
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Freeswitch/Asterisk connection settings
const MEDIA_SERVER_URL = Deno.env.get("MEDIA_SERVER_URL") || "http://localhost:8021";
const MEDIA_SERVER_PASSWORD = Deno.env.get("MEDIA_SERVER_PASSWORD") || "";
const SIP_TRUNK_GATEWAY = Deno.env.get("SIP_TRUNK_GATEWAY") || "";

// API Keys for third-party services
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY") || "";
const DEEPGRAM_API_KEY = Deno.env.get("DEEPGRAM_API_KEY") || "";

// Helper function to connect to the media server
async function connectToMediaServer() {
  try {
    console.log("Conectando ao servidor de mídia...");
    
    // In a real implementation, this would establish a connection to FreeSWITCH/Asterisk
    // For now, we'll simulate this connection
    
    // Simple validation of environment variables
    if (!SIP_TRUNK_GATEWAY) {
      throw new Error("SIP_TRUNK_GATEWAY não configurado nas variáveis de ambiente");
    }
    
    return {
      connected: true,
      serverInfo: {
        type: "FreeSWITCH",
        version: "1.10.7"
      }
    };
  } catch (error) {
    console.error("Erro ao conectar ao servidor de mídia:", error);
    throw error;
  }
}

// Helper function to initiate a call through the media server
async function initiateMediaServerCall(phoneNumber: string, config: any) {
  try {
    console.log(`Iniciando chamada para ${phoneNumber} através do servidor de mídia`);
    
    // Generate a unique call ID
    const callId = `call-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
    
    // In a real implementation, this would make an API call to FreeSWITCH/Asterisk
    // to initiate a call using the configured SIP trunk
    
    // For the PoC implementation, simulate a successful call initiation
    return {
      callId,
      status: "initiated",
      timestamp: new Date().toISOString(),
      phoneNumber
    };
  } catch (error) {
    console.error("Erro ao iniciar chamada através do servidor de mídia:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("\n=== VOICEBOT-CALL HANDLER ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Method: ${req.method}`);
    
    // Verify required API keys
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY não está configurada nas variáveis de ambiente");
    }
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY não está configurada nas variáveis de ambiente");
    }
    
    // Extract request data
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData, null, 2));
    
    const {
      phoneNumber,
      agentId,
      campaignId,
      leadId,
      initialMessage,
      voiceId,
      config
    } = requestData;
    
    if (!phoneNumber) {
      throw new Error("Número de telefone não fornecido");
    }
    
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Credenciais Supabase não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Connect to the media server
    console.log("Estabelecendo conexão com o servidor de mídia...");
    const mediaServerConnection = await connectToMediaServer();
    console.log("Conexão estabelecida:", mediaServerConnection);
    
    // Fetch agent information if agentId is provided
    let agentInfo = null;
    if (agentId) {
      const { data: agent, error: agentError } = await supabase
        .from("agents")
        .select("*")
        .eq("id", agentId)
        .single();
        
      if (agentError) {
        console.warn("Erro ao buscar informações do agente:", agentError);
      } else {
        agentInfo = agent;
        console.log("Informações do agente carregadas:", agentInfo);
      }
    }
    
    // Prepare system prompt for the LLM based on agent info
    const systemPrompt = agentInfo?.system_prompt || 
      "Você é um assistente de atendimento telefônico profissional. Seja cordial, claro e objetivo. " +
      "Responda de forma natural em português brasileiro, evitando respostas longas.";
    
    // Initiate the call through the media server
    const call = await initiateMediaServerCall(phoneNumber, {
      ...config,
      systemPrompt,
      voiceId: voiceId || (agentInfo?.voice_id || "FGY2WhTYpPnrIDTdsKH5")
    });
    
    // Log the call in the database
    const { data: callLog, error: logError } = await supabase
      .from("call_logs")
      .insert({
        call_sid: call.callId,
        status: call.status,
        from_number: "SIP_TRUNK",
        to_number: phoneNumber,
        agent_id: agentId,
        campaign_id: campaignId,
        lead_id: leadId,
        call_type: "full-duplex",
        call_source: "custom-voicebot",
        voice_id: voiceId,
        system_prompt: systemPrompt,
        initial_message: initialMessage || ""
      })
      .select();
      
    if (logError) {
      console.error("Erro ao registrar chamada no banco de dados:", logError);
    } else {
      console.log("Chamada registrada no banco de dados:", callLog);
    }
    
    return new Response(
      JSON.stringify({
        success: true,
        callId: call.callId,
        status: call.status,
        message: "Chamada iniciada com sucesso através do servidor de mídia personalizado"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Erro na função voicebot-call:", error);
    
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
