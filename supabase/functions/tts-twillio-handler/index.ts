
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para importar o cliente Twilio
async function getTwilioClient(accountSid, authToken) {
  try {
    // Import Twilio usando importação ESM compatível com Deno
    const twilio = await import("npm:twilio@4.20.0");
    return new twilio.default(accountSid, authToken);
  } catch (error) {
    console.error("Erro ao inicializar cliente Twilio:", error);
    throw new Error(`Falha ao inicializar cliente Twilio: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se a request é POST ou GET
    const isPostRequest = req.method === "POST";
    
    // Vamos tratar dados de POST e GET de forma diferente
    let text, voiceId, phoneNumber, callSid;
    
    if (isPostRequest) {
      // Para requisições POST, extrair dados do corpo JSON
      const requestData = await req.json();
      
      // Suportar tanto 'text' quanto 'message'
      text = requestData.text || requestData.message; // Aceita text OU message
      voiceId = requestData.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Voz padrão (Antônio)
      phoneNumber = requestData.phoneNumber;
      callSid = requestData.callSid || `manual-${Date.now()}`;
      
      console.log("[DEBUG] TTS-Handler: Dados recebidos via POST:", {
        text: text?.substring(0, 50) + (text?.length > 50 ? '...' : ''),
        textoCompleto: text,
        voiceId,
        phoneNumber,
        callSid
      });
    } else {
      // Para requisições GET, extrair dados da URL
      const url = new URL(req.url);
      text = url.searchParams.get('text');
      voiceId = url.searchParams.get('voiceId') || "21m00Tcm4TlvDq8ikWAM";
      phoneNumber = url.searchParams.get('phoneNumber');
      callSid = url.searchParams.get('callSid') || `manual-${Date.now()}`;
      
      console.log(`[DEBUG] TTS-Handler: Parâmetros recebidos via GET:
        - text: ${text?.substring(0, 50)}${text?.length && text.length > 50 ? '...' : ''}
        - text completo: "${text}"
        - text decodificado: "${text ? decodeURIComponent(text) : ''}"
        - voiceId: ${voiceId}
        - phoneNumber: ${phoneNumber}
        - callSid: ${callSid}
        - URL completa: ${req.url}
      `);
    }

    // Verifica se é um teste ou solicitação real
    console.log(`[DEBUG] TTS-Handler: URL completo: ${req.url}`);
    console.log(`[DEBUG] TTS-Handler: Origem da requisição: ${req.headers.get("origin") || "desconhecida"}`);
    console.log(`[DEBUG] TTS-Handler: User-Agent: ${req.headers.get("user-agent") || "desconhecido"}`);
    // Logar todos os cabeçalhos da requisição para debugging
    console.log(`[DEBUG] TTS-Handler: Headers da requisição: ${JSON.stringify(Object.fromEntries(req.headers))}`);

    if (!text) {
      const errorMessage = "Parâmetro text/message é obrigatório e está ausente na requisição";
      console.error(`[ERROR] TTS-Handler: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    if (!phoneNumber) {
      const errorMessage = "Parâmetro phoneNumber é obrigatório";
      console.error(`[ERROR] TTS-Handler: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Decodificar o texto para garantir que acentos e caracteres especiais estão corretos
    const decodedText = decodeURIComponent(text);
    if (decodedText.trim().length === 0) {
      const errorMessage = "O texto decodificado está vazio ou contém apenas espaços";
      console.error(`[ERROR] TTS-Handler: ${errorMessage}`);
      throw new Error(errorMessage);
    }

    // Obter API key do ElevenLabs e Twilio
    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    // Verificar credenciais configuradas
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error("[ERROR] TTS-Handler: Credenciais do Twilio não configuradas corretamente:");
      console.error(`- TWILIO_ACCOUNT_SID: ${twilioAccountSid ? "configurado" : "não configurado"}`);
      console.error(`- TWILIO_AUTH_TOKEN: ${twilioAuthToken ? "configurado" : "não configurado"}`);
      console.error(`- TWILIO_PHONE_NUMBER: ${twilioPhoneNumber ? "configurado" : "não configurado"}`);
      throw new Error("Credenciais Twilio não configuradas completamente");
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Formatar número de telefone para formato internacional
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    // Se o número não começar com +, adicionar +55 (Brasil)
    if (!formattedPhone.startsWith('+')) {
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = `55${formattedPhone}`;
      }
      formattedPhone = `+${formattedPhone}`;
    }
    
    console.log(`[DEBUG] TTS-Handler: Número de telefone formatado: ${formattedPhone}`);
    console.log(`[DEBUG] TTS-Handler: Texto a ser falado: ${decodedText}`);
    
    try {
      // Inicializar cliente Twilio
      console.log(`[DEBUG] TTS-Handler: Inicializando cliente Twilio`);
      const twilioClient = await getTwilioClient(twilioAccountSid, twilioAuthToken);

      // Usar TwiML simples que usa o texto diretamente
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="woman" language="pt-BR">${decodedText}</Say>
      </Response>`;

      console.log(`[DEBUG] TTS-Handler: TwiML preparado: ${twiml}`);
      
      console.log(`[DEBUG] TTS-Handler: Fazendo chamada Twilio para número ${formattedPhone} do número ${twilioPhoneNumber}`);
      
      // Criar chamada usando o cliente Twilio
      const call = await twilioClient.calls.create({
        twiml: twiml,
        to: formattedPhone,
        from: twilioPhoneNumber
      });
      
      console.log(`[DEBUG] TTS-Handler: Chamada iniciada com sucesso. SID: ${call.sid}`);
      
      // Salvar informações da chamada para rastreamento
      try {
        await supabase
          .from("call_logs")
          .insert({
            call_sid: call.sid,
            phone_number: phoneNumber,
            message: decodedText,
            voice_id: voiceId,
            status: "initiated"
          });
          
        console.log("[DEBUG] TTS-Handler: Log da chamada salvo no banco de dados");
      } catch (dbError) {
        console.warn(`[WARN] TTS-Handler: Não foi possível registrar a chamada no banco: ${dbError}`);
      }
      
      // Retornar resposta com informações da chamada
      return new Response(
        JSON.stringify({
          success: true,
          call_sid: call.sid,
          phone_number: phoneNumber,
          status: "initiated"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (twilioCallError) {
      console.error(`[ERROR] TTS-Handler: Erro ao iniciar chamada com Twilio: ${twilioCallError}`);
      throw new Error(`Falha ao iniciar chamada Twilio: ${twilioCallError.message}`);
    }
  } catch (error) {
    console.error(`[ERROR] TTS-Handler: Erro no handler TTS-Twilio: ${error}`);
    
    // Retornar detalhes do erro como JSON
    return new Response(
      JSON.stringify({
        error: true,
        message: error.message || "Erro desconhecido",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      },
    );
  }
});
