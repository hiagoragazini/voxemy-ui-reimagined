
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para escapar caracteres XML/HTML
function escapeXML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Função para validar e limpar texto
function sanitizeText(text: string): string {
  if (!text) return "";
  
  // Remover caracteres de controle e não-UTF-8
  const cleaned = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
    
  // Escapar para XML
  return escapeXML(cleaned);
}

// Função para construir URL do webhook de forma robusta
function buildWebhookUrl(supabaseUrl: string, functionName: string): string {
  try {
    const url = new URL(supabaseUrl);
    const webhookUrl = `https://${url.hostname}/functions/v1/${functionName}`;
    console.log(`[DEBUG] TTS-Handler: Webhook URL construída: ${webhookUrl}`);
    return webhookUrl;
  } catch (error) {
    console.error(`[ERROR] TTS-Handler: Erro ao construir URL: ${error}`);
    throw new Error("Erro ao construir URL do webhook");
  }
}

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
    console.log(`\n=== TTS-HANDLER INICIADO (VERSÃO CORRIGIDA) ===`);
    console.log(`[DEBUG] TTS-Handler: Timestamp: ${new Date().toISOString()}`);
    console.log(`[DEBUG] TTS-Handler: Method: ${req.method}`);
    console.log(`[DEBUG] TTS-Handler: URL: ${req.url}`);
    console.log(`[DEBUG] TTS-Handler: Headers: ${JSON.stringify(Object.fromEntries(req.headers))}`);

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
        textPreview: text?.substring(0, 50),
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
        textPreview: text?.substring(0, 50),
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

    // Decodificar e sanitizar texto
    const decodedText = decodeURIComponent(text);
    const sanitizedText = sanitizeText(decodedText);
    
    if (sanitizedText.trim().length === 0) {
      console.error("[ERROR] TTS-Handler: Texto sanitizado está vazio");
      throw new Error("O texto fornecido está vazio ou inválido");
    }

    console.log(`[DEBUG] TTS-Handler: Texto original: "${decodedText}"`);
    console.log(`[DEBUG] TTS-Handler: Texto sanitizado: "${sanitizedText}"`);

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
    
    try {
      console.log(`[DEBUG] TTS-Handler: Inicializando cliente Twilio`);
      const twilioClient = await getTwilioClient(twilioAccountSid, twilioAuthToken);

      // Construir URLs de webhook de forma robusta
      const processDialogUrl = buildWebhookUrl(supabaseUrl, "process-dialog");
      const callStatusUrl = buildWebhookUrl(supabaseUrl, "call-status");
      
      console.log(`[DEBUG] TTS-Handler: URL process-dialog: ${processDialogUrl}`);
      console.log(`[DEBUG] TTS-Handler: URL call-status: ${callStatusUrl}`);
      
      // TwiML robusto com timeouts aumentados e fallbacks melhorados
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="pt-BR">${sanitizedText}</Say>
  <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="15" action="${processDialogUrl}" method="POST">
    <Say voice="woman" language="pt-BR">Como posso ajudar você?</Say>
  </Gather>
  <Say voice="woman" language="pt-BR">Obrigada pelo contato. Tenha um ótimo dia!</Say>
  <Hangup/>
</Response>`;

      console.log(`[DEBUG] TTS-Handler: TwiML gerado (${twiml.length} chars):`);
      console.log(twiml);
      console.log(`[DEBUG] TTS-Handler: Chamando ${formattedPhone} do ${twilioPhoneNumber}`);
      
      const call = await twilioClient.calls.create({
        twiml: twiml,
        to: formattedPhone,
        from: twilioPhoneNumber,
        statusCallback: callStatusUrl,
        statusCallbackMethod: 'POST',
        statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
        timeout: 45, // Aumentado para Brasil
        record: false,
        machineDetection: 'Enable', // Detectar secretária eletrônica
        machineDetectionTimeout: 10
      });
      
      console.log(`[SUCCESS] TTS-Handler: Chamada criada com SID: ${call.sid}`);
      console.log(`[DEBUG] TTS-Handler: Status inicial: ${call.status}`);
      console.log(`[DEBUG] TTS-Handler: Direção: ${call.direction}`);
      
      // Salvar no banco com mais detalhes
      try {
        const { data: insertData, error: insertError } = await supabase
          .from("call_logs")
          .insert({
            call_sid: call.sid,
            phone_number: phoneNumber,
            message: decodedText,
            voice_id: voiceId,
            status: "initiated",
            agent_id: agentId || null,
            campaign_id: campaignId || null,
            lead_id: leadId || null,
            created_at: new Date().toISOString()
          })
          .select();
          
        if (insertError) {
          console.error("[ERROR] TTS-Handler: Erro ao inserir no banco:", insertError);
        } else {
          console.log("[SUCCESS] TTS-Handler: Log salvo no banco:", insertData);
        }
      } catch (dbError) {
        console.error(`[ERROR] TTS-Handler: Erro inesperado no banco: ${dbError}`);
      }
      
      return new Response(
        JSON.stringify({
          success: true,
          call_sid: call.sid,
          phone_number: phoneNumber,
          status: call.status,
          direction: call.direction,
          message: "Chamada iniciada com sistema corrigido",
          webhook_urls: {
            process_dialog: processDialogUrl,
            call_status: callStatusUrl
          },
          text_info: {
            original_length: decodedText.length,
            sanitized_length: sanitizedText.length,
            preview: sanitizedText.substring(0, 100)
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } catch (twilioCallError) {
      console.error(`[ERROR] TTS-Handler: Erro Twilio detalhado:`, {
        message: twilioCallError.message,
        code: twilioCallError.code,
        moreInfo: twilioCallError.moreInfo,
        status: twilioCallError.status
      });
      throw new Error(`Falha na chamada Twilio [${twilioCallError.code}]: ${twilioCallError.message}`);
    }
  } catch (error) {
    console.error(`[ERROR] TTS-Handler: Erro geral:`, {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    return new Response(
      JSON.stringify({
        error: true,
        message: error.message || "Erro desconhecido",
        timestamp: new Date().toISOString(),
        debug_info: {
          error_type: error.name,
          has_stack: !!error.stack
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      },
    );
  }
});
