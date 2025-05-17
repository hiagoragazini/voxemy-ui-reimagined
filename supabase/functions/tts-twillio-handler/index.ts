
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
      
      // MODIFICAÇÃO IMPORTANTE: Suportar tanto 'text' quanto 'message'
      text = requestData.text || requestData.message; // Aceita text OU message
      voiceId = requestData.voiceId || "21m00Tcm4TlvDq8ikWAM"; // Voz padrão
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
    
    if (!elevenlabsApiKey) {
      throw new Error("ElevenLabs API key não configurada");
    }
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      throw new Error("Credenciais Twilio não configuradas completamente");
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se já temos o áudio gerado para este texto e voz (cache)
    // Usando hash do texto para garantir nome seguro de arquivo
    const textHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(decodedText)
    ).then(hash => {
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
        .substring(0, 40); // primeiros 40 caracteres do hash
    });
    
    console.log(`[DEBUG] TTS-Handler: Hash gerado para o texto: ${textHash}`);
    
    // NOVO: Gerar um ID único para essa versão do arquivo para evitar problemas de cache
    const uniqueId = Date.now();
    const uniqueFileName = `${voiceId}_${textHash}_${uniqueId}.mp3`;
    
    // Fazer a requisição real para geração de áudio com parâmetros otimizados para telefonia
    // Solicitamos formato otimizado para telefonia - similar ao que ffmpeg faria
    const elevenlabsResponse = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenlabsApiKey,
          "User-Agent": "Voxemy-TTS-Function/1.0",
        },
        body: JSON.stringify({
          text: decodedText,
          model_id: "eleven_multilingual_v2", // Modelo multilíngue mais recente para melhor suporte ao português
          output_format: "mp3_44100_128", // Formato específico que funciona melhor com Twilio
          voice_settings: {
            stability: 0.7,
            similarity_boost: 0.8,
            style: 0.0, // Reduzido para minimizar distorção
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text();
      console.error(`[ERROR] TTS-Handler: Falha na resposta do ElevenLabs: ${elevenlabsResponse.status} ${elevenlabsResponse.statusText} - ${errorText}`);
      throw new Error(`Falha ao gerar áudio com ElevenLabs: ${elevenlabsResponse.status} ${elevenlabsResponse.statusText}`);
    }

    // NOVO: Verificar headers da resposta para diagnosticar possíveis problemas
    console.log(`[DEBUG] TTS-Handler: Headers da resposta ElevenLabs: ${JSON.stringify(Object.fromEntries(elevenlabsResponse.headers))}`);
    
    // Obter o áudio como ArrayBuffer
    const audioBuffer = await elevenlabsResponse.arrayBuffer();
    
    console.log(`[DEBUG] TTS-Handler: Áudio gerado com sucesso. Tamanho: ${audioBuffer.byteLength} bytes`);
    if (audioBuffer.byteLength < 1000) {
      console.error(`[ERROR] TTS-Handler: Áudio gerado é muito pequeno (${audioBuffer.byteLength} bytes), pode indicar erro`);
    }
    
    // Verificar se o conteúdo parece ser realmente um MP3 válido
    try {
      // Verificar os primeiros bytes para confirmar que é um MP3 válido (header ID3 ou frame sync)
      const firstBytes = new Uint8Array(audioBuffer.slice(0, 4));
      const isID3 = firstBytes[0] === 73 && firstBytes[1] === 68 && firstBytes[2] === 51; // "ID3"
      const isMP3FrameSync = (firstBytes[0] === 0xFF && (firstBytes[1] & 0xE0) === 0xE0);
      
      if (!isID3 && !isMP3FrameSync) {
        console.warn(`[WARN] TTS-Handler: O conteúdo recebido não parece ser um arquivo MP3 válido. Primeiros bytes: ${Array.from(firstBytes).join(',')}`);
      } else {
        console.log(`[DEBUG] TTS-Handler: Conteúdo validado como MP3 válido (${isID3 ? 'ID3 header' : 'MP3 frame sync'})`);
      }
    } catch (validationErr) {
      console.warn(`[WARN] TTS-Handler: Erro ao validar conteúdo MP3: ${validationErr}`);
    }
    
    // Inicializar cliente Twilio
    console.log(`[DEBUG] TTS-Handler: Inicializando cliente Twilio`);
    const twilioClient = await getTwilioClient(twilioAccountSid, twilioAuthToken);

    // Método mais direto: fazer um TwiML com Url direto para o ElevenLabs API
    try {
      console.log(`[DEBUG] TTS-Handler: Fazendo chamada Twilio para número ${phoneNumber}`);
      
      // Usar TwiML simples que usa o texto diretamente
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="woman" language="pt-BR">${decodedText}</Say>
      </Response>`;

      // Criar chamada usando o cliente Twilio
      const call = await twilioClient.calls.create({
        twiml: twiml,
        to: phoneNumber,
        from: twilioPhoneNumber,
        timeout: 30
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
