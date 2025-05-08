
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Twilio } from "https://esm.sh/twilio@4.20.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verificar se as credenciais do Twilio estão configuradas
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    
    if (!twilioAccountSid || !twilioAuthToken) {
      throw new Error("Credenciais do Twilio não estão configuradas");
    }

    // Obter dados da requisição
    const { 
      phoneNumber, 
      callbackUrl,
      agentId,
      campaignId,
      twimlInstructions 
    } = await req.json();

    if (!phoneNumber) {
      throw new Error("Número de telefone é obrigatório");
    }

    console.log(`Iniciando chamada para ${phoneNumber}`);

    // Inicializar cliente Twilio
    const client = new Twilio(twilioAccountSid, twilioAuthToken);

    // Formatar o número para o formato internacional
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);

    // Criar TwiML para a chamada
    let twiml = twimlInstructions;
    if (!twiml) {
      twiml = `
        <Response>
          <Say language="pt-BR">Olá, esta é uma chamada automatizada. Obrigado por atender.</Say>
          <Pause length="1"/>
          <Say language="pt-BR">Esta é uma demonstração da integração do Twilio com o Eleven Labs.</Say>
        </Response>
      `;
    }

    // Parâmetros para a URL de callback
    let callbackParams = '';
    if (callbackUrl) {
      if (agentId) callbackParams += `&agentId=${agentId}`;
      if (campaignId) callbackParams += `&campaignId=${campaignId}`;
      
      // Adicionar os parâmetros à URL de callback se houver
      const finalCallbackUrl = callbackParams 
        ? `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}${callbackParams.substring(1)}`
        : callbackUrl;
        
      console.log(`URL de callback: ${finalCallbackUrl}`);
    }

    // Fazer a chamada
    const call = await client.calls.create({
      twiml: twiml,
      to: formattedPhoneNumber,
      from: "+15155172542", // Número do Twilio (troque por um número válido da sua conta)
      statusCallback: callbackUrl ? callbackUrl : undefined,
      statusCallbackEvent: callbackUrl ? ['initiated', 'ringing', 'answered', 'completed'] : undefined,
      statusCallbackMethod: 'POST',
    });

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
  
  // Se não começar com +, adicionar código do Brasil (+55)
  if (!phoneNumber.startsWith('+')) {
    // Se já começar com 55, adicionar apenas o +
    if (cleaned.startsWith('55')) {
      cleaned = '+' + cleaned;
    } else {
      cleaned = '+55' + cleaned;
    }
  }
  
  return cleaned;
}
