
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para importar o cliente Twilio
async function getTwilioClient(accountSid, authToken) {
  try {
    const twilio = await import("npm:twilio@4.20.0");
    return new twilio.default(accountSid, authToken);
  } catch (error) {
    console.error("[ERROR] TTS-Handler: Erro ao inicializar cliente Twilio:", error);
    throw new Error(`Falha ao inicializar cliente Twilio: ${error.message}`);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log(`\n=== TTS-HANDLER INICIADO ===`);
    console.log(`[DEBUG] TTS-Handler: Timestamp: ${new Date().toISOString()}`);
    console.log(`[DEBUG] TTS-Handler: Method: ${req.method}`);
    console.log(`[DEBUG] TTS-Handler: URL: ${req.url}`);

    const isPostRequest = req.method === "POST";
    let text, voiceId, phoneNumber, callSid, agentId, campaignId, leadId;
    
    if (isPostRequest) {
      const requestData = await req.json();
      text = requestData.text || requestData.message;
      voiceId = requestData.voiceId || "21m00Tcm4TlvDq8ikWAM";
      phoneNumber = requestData.phoneNumber;
      callSid = requestData.callSid || `manual-${Date.now()}`;
      agentId = requestData.agentId;
      campaignId = requestData.campaignId;
      leadId = requestData.leadId;
      
      console.log("[DEBUG] TTS-Handler: Dados via POST:", {
        textLength: text?.length,
        voiceId,
        phoneNumber,
        callSid,
        agentId
      });
    } else {
      const url = new URL(req.url);
      text = url.searchParams.get('text');
      voiceId = url.searchParams.get('voiceId') || "21m00Tcm4TlvDq8ikWAM";
      phoneNumber = url.searchParams.get('phoneNumber');
      callSid = url.searchParams.get('callSid') || `manual-${Date.now()}`;
      agentId = url.searchParams.get('agentId');
      campaignId = url.searchParams.get('campaignId');
      leadId = url.searchParams.get('leadId');
      
      console.log("[DEBUG] TTS-Handler: Dados via GET:", {
        textLength: text?.length,
        voiceId,
        phoneNumber,
        callSid
      });
    }

    if (!text) {
      console.error("[ERROR] TTS-Handler: Texto obrigatório não fornecido");
      throw new Error("Parâmetro text/message é obrigatório");
    }

    if (!phoneNumber) {
      console.error("[ERROR] TTS-Handler: Número de telefone obrigatório não fornecido");
      throw new Error("Parâmetro phoneNumber é obrigatório");
    }

    const decodedText = decodeURIComponent(text);
    if (decodedText.trim().length === 0) {
      console.error("[ERROR] TTS-Handler: Texto decodificado está vazio");
      throw new Error("O texto decodificado está vazio");
    }

    // Verificar credenciais Twilio
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error("[ERROR] TTS-Handler: Credenciais Twilio incompletas");
      throw new Error("Credenciais Twilio não configuradas completamente");
    }

    // Verificar Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[ERROR] TTS-Handler: Credenciais Supabase não configuradas");
      throw new Error("Credenciais Supabase não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Formatar número de telefone
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = `55${formattedPhone}`;
      }
      formattedPhone = `+${formattedPhone}`;
    }
    
    console.log(`[DEBUG] TTS-Handler: Número formatado: ${formattedPhone}`);
    console.log(`[DEBUG] TTS-Handler: Texto para falar: "${decodedText}"`);
    
    try {
      console.log(`[DEBUG] TTS-Handler: Inicializando cliente Twilio`);
      const twilioClient = await getTwilioClient(twilioAccountSid, twilioAuthToken);

      // CORREÇÃO CRÍTICA: URL correta para o process-dialog
      const supabaseDomain = supabaseUrl.replace('https://', '').replace('http://', '');
      const processDialogUrl = `https://${supabaseDomain}/functions/v1/process-dialog`;
      
      console.log(`[DEBUG] TTS-Handler: URL de callback CORRIGIDA: ${processDialogUrl}`);
      
      // TwiML simplificado e robusto
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="pt-BR">${decodedText}</Say>
  <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="10" action="${processDialogUrl}" method="POST">
    <Say voice="woman" language="pt-BR">Como posso ajudar você?</Say>
  </Gather>
  <Say voice="woman" language="pt-BR">Não consegui ouvir sua resposta. Até logo!</Say>
  <Hangup/>
</Response>`;

      console.log(`[DEBUG] TTS-Handler: TwiML preparado com URL correta`);
      console.log(`[DEBUG] TTS-Handler: Chamando número ${formattedPhone} do número ${twilioPhoneNumber}`);
      
      const call = await twilioClient.calls.create({
        twiml: twiml,
        to: formattedPhone,
        from: twilioPhoneNumber,
        statusCallback: `https://${supabaseDomain}/functions/v1/call-status`,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        timeout: 30,
        record: false
      });
      
      console.log(`[SUCCESS] TTS-Handler: Chamada iniciada com SID: ${call.sid}`);
      
      // Salvar no banco
      try {
        await supabase
          .from("call_logs")
          .insert({
            call_sid: call.sid,
            phone_number: phoneNumber,
            message: decodedText,
            voice_id: voiceId,
            status: "initiated",
            agent_id: agentId || null,
            campaign_id: campaignId || null,
            lead_id: leadId || null
          });
          
        console.log("[DEBUG] TTS-Handler: Log salvo no banco");
      } catch (dbError) {
        console.warn(`[WARN] TTS-Handler: Erro ao salvar no banco: ${dbError}`);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          call_sid: call.sid,
          phone_number: phoneNumber,
          status: "initiated",
          message: "Chamada iniciada com diálogo interativo corrigido",
          callback_url: processDialogUrl
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (twilioCallError) {
      console.error(`[ERROR] TTS-Handler: Erro Twilio: ${twilioCallError}`);
      throw new Error(`Falha na chamada Twilio: ${twilioCallError.message}`);
    }
  } catch (error) {
    console.error(`[ERROR] TTS-Handler: Erro geral: ${error}`);
    
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
