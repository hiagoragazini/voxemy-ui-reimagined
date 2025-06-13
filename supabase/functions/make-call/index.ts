
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function getTwilioClient(accountSid: string, authToken: string) {
  try {
    const twilio = await import("npm:twilio@4.20.0");
    return new twilio.default(accountSid, authToken);
  } catch (error) {
    console.error("Erro ao inicializar cliente Twilio:", error);
    throw new Error(`Falha ao inicializar Twilio: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestBody = await req.json();

    // Teste de conectividade
    if (requestBody.test === true) {
      console.log("Teste de conectividade da função make-call");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Função make-call acessível",
          env: {
            twilioAccountSidConfigured: Boolean(Deno.env.get("TWILIO_ACCOUNT_SID")),
            twilioAuthTokenConfigured: Boolean(Deno.env.get("TWILIO_AUTH_TOKEN")),
            twilioPhoneNumberConfigured: Boolean(Deno.env.get("TWILIO_PHONE_NUMBER")),
            elevenLabsKeyConfigured: Boolean(Deno.env.get("ELEVENLABS_API_KEY"))
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verificar credenciais Twilio
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhone) {
      throw new Error("Credenciais Twilio não configuradas");
    }

    console.log(`Usando credenciais Twilio: SID: ${twilioAccountSid.substring(0, 5)}...`);
    console.log(`Telefone Twilio: ${twilioPhone}`);

    let { 
      phoneNumber, 
      callbackUrl,
      agentId,
      campaignId,
      agentName,
      leadId,
      useAI = true,
      voiceId,
      message,
      recordCall = true,
      transcribeCall = true
    } = requestBody;

    console.log("\n=== MAKE-CALL DEBUG ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Telefone: ${phoneNumber}`);
    console.log(`Voice ID: ${voiceId || "padrão"}`);
    console.log(`Mensagem: "${message || "não fornecida"}"`);
    console.log(`Agente: ${agentName} (${agentId})`);

    if (!phoneNumber) {
      throw new Error("Número de telefone é obrigatório");
    }

    if (!message) {
      console.warn("Aviso: Nenhuma mensagem fornecida. Usando mensagem padrão.");
      message = `Olá, aqui é ${agentName || "assistente virtual"}. Como posso ajudá-lo hoje?`;
    }

    console.log(`Iniciando ligação para ${phoneNumber}`);

    try {
      const client = await getTwilioClient(twilioAccountSid, twilioAuthToken);
      console.log("Cliente Twilio criado com sucesso");

      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      console.log(`Número formatado: ${formattedPhoneNumber}`);
      
      const baseUrl = Deno.env.get("SUPABASE_URL") || "";
      
      if (!baseUrl) {
        console.warn("SUPABASE_URL não configurada");
      }
      
      // Criar TwiML para ligação com IA
      let twiml;
      
      if (message && useAI) {
        const callId = `call_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        const encodedMessage = encodeURIComponent(message);
        const encodedVoiceId = encodeURIComponent(voiceId || "21m00Tcm4TlvDq8ikWAM");
        const timestamp = Date.now();
        
        // URL para nosso handler TTS que funciona com Twilio Assets
        const ttsUrl = `${baseUrl}/functions/v1/tts-twillio-handler?text=${encodedMessage}&voiceId=${encodedVoiceId}&callSid=${callId}&_t=${timestamp}`;
        
        console.log(`URL TTS gerada: ${ttsUrl}`);
        
        // TwiML que redireciona para nosso handler TTS
        twiml = `
          <Response>
            <Redirect method="GET">${ttsUrl}</Redirect>
          </Response>
        `;
      } else {
        // Mensagem simples usando Say
        twiml = `
          <Response>
            <Say language="pt-BR">${message || "Esta é uma ligação da Voxemy. Obrigado por atender."}</Say>
          </Response>
        `;
      }

      console.log(`TwiML configurado: ${twiml}`);

      // Configurar callback URL
      let finalCallbackUrl = callbackUrl;
      if (callbackUrl) {
        const params = new URLSearchParams();
        if (agentId) params.append('agentId', agentId);
        if (campaignId) params.append('campaignId', campaignId);
        if (leadId) params.append('leadId', leadId);
        if (recordCall) params.append('recordCall', 'true');
        if (transcribeCall) params.append('transcribeCall', 'true');
        
        if (params.toString()) {
          finalCallbackUrl = `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}${params.toString()}`;
        }
        
        console.log(`Callback URL: ${finalCallbackUrl}`);
      }

      // Parâmetros da ligação
      const callParams = {
        twiml: twiml,
        to: formattedPhoneNumber,
        from: twilioPhone,
        statusCallback: finalCallbackUrl || undefined,
        statusCallbackEvent: finalCallbackUrl ? ['initiated', 'ringing', 'answered', 'completed'] : undefined,
        statusCallbackMethod: 'POST',
        record: recordCall,
        timeout: 30,
        machineDetection: 'DetectMessageEnd',
      };
      
      console.log(`Parâmetros da ligação: ${JSON.stringify(callParams, null, 2)}`);
      
      const call = await client.calls.create(callParams);
      
      console.log("Ligação criada com sucesso:", call.sid);
      console.log("Status inicial:", call.status);
      
      // Atualizar status do lead se fornecido
      if (leadId) {
        try {
          const supabaseUrl = Deno.env.get("SUPABASE_URL");
          const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
          
          if (supabaseUrl && supabaseKey) {
            const supabase = createClient(supabaseUrl, supabaseKey);
            
            await supabase
              .from("leads")
              .update({ 
                status: "called",
                call_result: "Ligação iniciada"
              })
              .eq("id", leadId);
              
            console.log(`Status do lead ${leadId} atualizado para 'called'`);
            
            // Criar entrada no log de ligações
            await supabase.from("call_logs").insert({
              call_sid: call.sid,
              status: call.status,
              from_number: twilioPhone,
              to_number: formattedPhoneNumber,
              agent_id: agentId,
              campaign_id: campaignId,
              lead_id: leadId
            });
            
            console.log(`Log de ligação criado para SID: ${call.sid}`);
          }
        } catch (err) {
          console.error("Erro ao atualizar status do lead:", err);
        }
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          callSid: call.sid,
          status: call.status
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
      
    } catch (twilioError) {
      console.error("Erro Twilio:", twilioError);
      
      const errorDetails = {
        message: twilioError.message || "Erro Twilio desconhecido",
        code: twilioError.code,
        moreInfo: twilioError.moreInfo,
        status: twilioError.status
      };
      
      throw new Error(`Erro Twilio: ${JSON.stringify(errorDetails)}`);
    }
  } catch (error) {
    console.error("Erro ao fazer ligação:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro ao processar solicitação" 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

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
  
  console.log(`Número original: ${phoneNumber}, Formatado: ${cleaned}`);
  return cleaned;
}
