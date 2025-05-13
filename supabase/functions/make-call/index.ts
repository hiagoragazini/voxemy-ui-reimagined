
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Método alternativo de importação do Twilio compatível com Deno
const getTwilioClient = async (accountSid: string, authToken: string) => {
  // Importação dinâmica do cliente Twilio
  const { Twilio } = await import("https://esm.sh/twilio@4.20.0");
  return new Twilio(accountSid, authToken);
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const requestBody = await req.json();

    // Se for apenas um teste, não faz a chamada, apenas retorna que a função está acessível
    if (requestBody.test === true) {
      console.log("Teste de conectividade com a função make-call");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Função make-call está acessível",
          env: {
            twilioAccountSidConfigured: Boolean(Deno.env.get("TWILIO_ACCOUNT_SID")),
            twilioAuthTokenConfigured: Boolean(Deno.env.get("TWILIO_AUTH_TOKEN")),
            twilioPhoneNumberConfigured: Boolean(Deno.env.get("TWILIO_PHONE_NUMBER"))
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Verificar se as credenciais do Twilio estão configuradas
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    if (!twilioAccountSid || !twilioAuthToken) {
      throw new Error("Credenciais do Twilio não estão configuradas nas variáveis de ambiente");
    }

    if (!twilioPhone) {
      console.warn("Número de telefone do Twilio não configurado. Por favor, configure a variável TWILIO_PHONE_NUMBER.");
      throw new Error("Número de telefone do Twilio (TWILIO_PHONE_NUMBER) não está configurado nas variáveis de ambiente");
    }

    // Log with credentials masked for security
    console.log(`Usando credenciais do Twilio: SID: ${twilioAccountSid.substring(0, 5)}...${twilioAccountSid.substring(twilioAccountSid.length - 4)}`);
    console.log(`Usando número de telefone do Twilio: ${twilioPhone}`);

    // Obter dados da requisição
    const { 
      phoneNumber, 
      callbackUrl,
      agentId,
      campaignId,
      agentName,
      leadId,
      useAI = true,
      aiModel = "gpt-4o-mini",
      systemPrompt,
      voiceId,
      twimlInstructions,
      recordCall = true,
      transcribeCall = true
    } = requestBody;

    if (!phoneNumber) {
      throw new Error("Número de telefone é obrigatório");
    }

    console.log(`Iniciando chamada para ${phoneNumber}`);

    // Inicializar cliente Twilio corretamente usando a importação dinâmica
    const client = await getTwilioClient(twilioAccountSid, twilioAuthToken);

    // Formatar o número para o formato internacional
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    console.log(`Número formatado: ${formattedPhoneNumber}`);

    // Base URL para funções
    const baseUrl = Deno.env.get("SUPABASE_URL") || "";
    if (!baseUrl) {
      console.warn("URL do Supabase não configurada, links de callback podem não funcionar corretamente");
    }
    
    // Criar TwiML para a chamada
    let twiml = twimlInstructions;
    if (!twiml) {
      // Se estiver usando IA conversacional
      if (useAI) {
        // Integração com função de AI + TTS para chamadas inteligentes
        const webhookBase = `${baseUrl}/functions/v1/call-handler?`;
        const params = new URLSearchParams();
        
        if (agentId) params.append("agentId", agentId);
        if (agentName) params.append("agentName", agentName);
        if (campaignId) params.append("campaignId", campaignId);
        if (leadId) params.append("leadId", leadId);
        if (aiModel) params.append("aiModel", aiModel);
        if (systemPrompt) params.append("systemPrompt", encodeURIComponent(systemPrompt));
        if (voiceId) params.append("voiceId", voiceId);
        if (transcribeCall) params.append("transcribe", "true");
        
        const webhookUrl = `${webhookBase}${params.toString()}`;
        
        console.log(`Configurando Stream URL para: ${webhookUrl}`);
        
        twiml = `
          <Response>
            <Connect>
              <Stream url="${webhookUrl}"/>
            </Connect>
            ${recordCall ? '<Record action="' + baseUrl + '/functions/v1/call-record-callback" recordingStatusCallback="' + baseUrl + '/functions/v1/call-record-status" recordingStatusCallbackMethod="POST" />' : ''}
          </Response>
        `;
      } else {
        // Chamada simples sem IA
        twiml = `
          <Response>
            <Say language="pt-BR">Olá, esta é uma chamada automatizada. Obrigado por atender.</Say>
            <Pause length="1"/>
            <Say language="pt-BR">Esta é uma demonstração da Voxemy.</Say>
            ${recordCall ? '<Record action="' + baseUrl + '/functions/v1/call-record-callback" recordingStatusCallback="' + baseUrl + '/functions/v1/call-record-status" recordingStatusCallbackMethod="POST" />' : ''}
          </Response>
        `;
      }
    }

    // Parâmetros para a URL de callback
    let callbackParams = '';
    if (callbackUrl) {
      if (agentId) callbackParams += `&agentId=${agentId}`;
      if (campaignId) callbackParams += `&campaignId=${campaignId}`;
      if (leadId) callbackParams += `&leadId=${leadId}`;
      if (recordCall) callbackParams += `&recordCall=true`;
      if (transcribeCall) callbackParams += `&transcribeCall=true`;
      
      // Adicionar os parâmetros à URL de callback se houver
      const finalCallbackUrl = callbackParams 
        ? `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}${callbackParams.substring(1)}`
        : callbackUrl;
        
      console.log(`URL de callback configurada: ${finalCallbackUrl}`);
    } else {
      console.log("Nenhuma URL de callback fornecida");
    }

    // Get the Twilio phone number from environment variables
    console.log(`Usando número do Twilio: ${twilioPhone}`);
    console.log(`TWIML configurado: ${twiml.substring(0, 100)}...`);

    // Fazer a chamada com tratamento de erros melhorado
    try {
      const call = await client.calls.create({
        twiml: twiml,
        to: formattedPhoneNumber,
        from: twilioPhone, // Usar o número configurado nas variáveis de ambiente
        statusCallback: callbackUrl || undefined,
        statusCallbackEvent: callbackUrl ? ['initiated', 'ringing', 'answered', 'completed'] : undefined,
        statusCallbackMethod: 'POST',
        record: recordCall,
      });
      
      console.log("Chamada criada com sucesso:", call.sid);
      console.log("Status inicial da chamada:", call.status);

      // Update lead status if leadId is provided
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
                call_result: "Chamada iniciada"
              })
              .eq("id", leadId);
              
            console.log(`Status do lead ${leadId} atualizado para 'called'`);
            
            // Create initial call log entry
            await supabase.from("call_logs").insert({
              call_sid: call.sid,
              status: call.status,
              from_number: twilioPhone,
              to_number: formattedPhoneNumber,
              agent_id: agentId,
              campaign_id: campaignId,
              lead_id: leadId
            });
            
            console.log(`Log de chamada inicial criado para SID: ${call.sid}`);
          } else {
            console.warn("Credenciais do Supabase não encontradas, não foi possível atualizar status do lead");
          }
        } catch (err) {
          console.error("Error updating lead status:", err);
          // Don't fail the whole request if this fails
        }
      }

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
    } catch (twilioError) {
      console.error("Erro do Twilio:", twilioError);
      
      // Enhanced error reporting
      const errorDetails = {
        message: twilioError.message || "Erro desconhecido do Twilio",
        code: twilioError.code,
        moreInfo: twilioError.moreInfo,
        status: twilioError.status
      };
      
      throw new Error(`Erro do Twilio: ${JSON.stringify(errorDetails)}`);
    }
  } catch (error) {
    console.error("Erro ao fazer chamada:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro ao processar a solicitação" 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Função para formatar número de telefone para o formato internacional
function formatPhoneNumber(phoneNumber: string): string {
  // Remover caracteres não numéricos
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // Se começar com 0, remover
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Remover o 9 extra se o número tiver 11 dígitos (para números de celular brasileiros)
  // Por exemplo: 11987654321 -> 11 + 8765-4321 (não removemos o 9 inicial)
  
  // Tratar números especificamente para o Brasil
  if (cleaned.length === 11 || cleaned.length === 10) {
    // Se não começar com +, adicionar código do Brasil (+55)
    if (!phoneNumber.startsWith('+')) {
      // Se já começar com 55, adicionar apenas o +
      if (cleaned.startsWith('55')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+55' + cleaned;
      }
    }
  } else {
    // Para números internacionais, apenas adicionar + se não existir
    if (!phoneNumber.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
  }
  
  console.log(`Número original: ${phoneNumber}, Formatado: ${cleaned}`);
  return cleaned;
}
