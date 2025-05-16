
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

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

// Função auxiliar para formatar número de telefone
function formatPhoneNumber(phoneNumber: string): string {
  // Remove non-numeric characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Handle numbers specifically for Brazil
  if (cleaned.length === 11 || cleaned.length === 10) {
    // If doesn't start with +, add Brazil country code (+55)
    if (!phoneNumber.startsWith('+')) {
      // If already starts with 55, just add the +
      if (cleaned.startsWith('55')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+55' + cleaned;
      }
    }
  } else {
    // For international numbers, just add + if it doesn't exist
    if (!phoneNumber.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
  }
  
  return cleaned;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const requestData = await req.json();
    const { 
      phoneNumber, 
      testAudioUrl,
      description = "Teste com arquivo MP3 simples"
    } = requestData;

    if (!phoneNumber) {
      throw new Error("Número de telefone é obrigatório");
    }

    if (!testAudioUrl) {
      throw new Error("URL de áudio de teste é obrigatória");
    }

    // Verificar se as credenciais Twilio estão configuradas
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhone) {
      throw new Error("Credenciais Twilio não configuradas corretamente");
    }

    // Log das informações
    console.log(`\n=== TESTE DE ÁUDIO INICIADO ===`);
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Número de telefone: ${phoneNumber}`);
    console.log(`URL do áudio de teste: ${testAudioUrl}`);
    console.log(`Descrição: ${description}`);

    // Criar cliente Twilio
    const client = await getTwilioClient(twilioAccountSid, twilioAuthToken);
    
    // Formatar número de telefone
    const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
    console.log(`Número formatado: ${formattedPhoneNumber}`);
    
    // Criar TwiML simples apenas com a tag Play
    const twiml = `
      <Response>
        <Play>${testAudioUrl}</Play>
      </Response>
    `;
    
    console.log(`TwiML: ${twiml}`);
    
    // Fazer a chamada
    const call = await client.calls.create({
      twiml: twiml,
      to: formattedPhoneNumber,
      from: twilioPhone,
      record: true,
      timeout: 30,
      machineDetection: 'DetectMessageEnd',
    });
    
    console.log(`Chamada criada com sucesso: ${call.sid}`);
    console.log(`Status inicial da chamada: ${call.status}`);
    
    // Retornar resultado
    return new Response(
      JSON.stringify({ 
        success: true, 
        callSid: call.sid,
        status: call.status,
        message: "Chamada de teste com áudio simples iniciada"
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error(`Erro ao fazer chamada de teste: ${error}`);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro desconhecido ao processar solicitação" 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
