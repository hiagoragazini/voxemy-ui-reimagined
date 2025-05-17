
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para importar o cliente Twilio
async function getTwilioClient(accountSid: string, authToken: string) {
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
    console.log("\n=== TWILIO-DIAGNOSTIC HANDLER ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    
    // Extrair dados da requisição
    const requestData = await req.json().catch(() => ({}));
    console.log("Request data:", JSON.stringify(requestData, null, 2));
    
    // Obter credenciais Twilio
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error("Credenciais Twilio ausentes:");
      console.error(`- TWILIO_ACCOUNT_SID: ${twilioAccountSid ? "configurado" : "não configurado"}`);
      console.error(`- TWILIO_AUTH_TOKEN: ${twilioAuthToken ? "configurado" : "não configurado"}`);
      console.error(`- TWILIO_PHONE_NUMBER: ${twilioPhoneNumber ? "configurado" : "não configurado"}`);
      throw new Error("Credenciais Twilio não configuradas completamente");
    }

    // Extrair o número de telefone e o modo de teste da requisição
    const { phoneNumber, mode = "basic", twiml: customTwiml } = requestData;
    
    if (!phoneNumber) {
      throw new Error("Número de telefone não fornecido");
    }
    
    // Formatar número de telefone
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = `55${formattedPhone}`;
      }
      formattedPhone = `+${formattedPhone}`;
    }
    
    console.log(`Número formatado: ${formattedPhone}`);
    
    // Obter URL base para webhooks do Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL não configurado");
    }
    
    // Construir a URL absoluta para o webhook de eco
    const echoWebhookUrl = `${supabaseUrl.replace(/\/$/g, "")}/functions/v1/twilio-echo`;
    console.log(`URL do webhook de eco: ${echoWebhookUrl}`);
    
    // Inicializar cliente Twilio
    console.log("Inicializando cliente Twilio...");
    const client = await getTwilioClient(twilioAccountSid, twilioAuthToken);
    
    // Criar TwiML baseado no modo selecionado
    let twiml: string;
    
    if (mode === "custom" && customTwiml) {
      console.log("Modo: TwiML personalizado");
      twiml = customTwiml;
    } else {
      console.log("Modo: Teste básico");
      // TwiML simplificado com voice="Polly.Camila" em vez de "woman"
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Camila" language="pt-BR">Esta é uma mensagem de teste do diagnóstico Twilio. Por favor, diga algo após o bipe.</Say>
  <Gather input="speech" language="pt-BR" action="${echoWebhookUrl}" method="POST" timeout="5">
    <Say voice="Polly.Camila" language="pt-BR">Por favor, fale agora.</Say>
  </Gather>
  <Say voice="Polly.Camila" language="pt-BR">Não ouvi nada. Vou encerrar a chamada.</Say>
  <Hangup/>
</Response>`;
    }
    
    // Log do TwiML para diagnóstico
    console.log("TwiML que será enviado:");
    console.log(twiml);
    
    // Fazer a chamada
    console.log(`Iniciando chamada de ${twilioPhoneNumber} para ${formattedPhone}`);
    const call = await client.calls.create({
      twiml: twiml,
      to: formattedPhone,
      from: twilioPhoneNumber,
      statusCallback: `${supabaseUrl}/functions/v1/call-status`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });
    
    console.log(`Chamada iniciada: SID ${call.sid}, status inicial: ${call.status}`);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Chamada de diagnóstico iniciada com sucesso",
        call_sid: call.sid,
        status: call.status,
        twiml_summary: mode === "custom" ? "TwiML personalizado" : "TwiML de diagnóstico básico"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Erro na função de diagnóstico Twilio:", error);
    
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
