
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

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
    const url = new URL(req.url);
    // Obter parâmetros da URL
    const text = url.searchParams.get('text');
    const voiceId = url.searchParams.get('voiceId') || "FGY2WhTYpPnrIDTdsKH5"; // Laura - voz default
    const callSid = url.searchParams.get('callSid') || `manual-${Date.now()}`;

    if (!text) {
      throw new Error("Parâmetro text é obrigatório");
    }

    // Obter API key do ElevenLabs
    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenlabsApiKey) {
      throw new Error("ElevenLabs API key não configurada");
    }

    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Supabase credentials não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se já temos o áudio gerado para este texto e voz (cache)
    const fileName = `${voiceId}_${Buffer.from(text).toString('base64').substring(0, 100)}.mp3`;
    const filePath = `calls/${callSid}/${fileName}`;
    
    // Verificar se o arquivo já existe no bucket
    const { data: existingFile } = await supabase
      .storage
      .from('tts_audio')
      .getPublicUrl(filePath);
    
    let audioUrl = existingFile?.publicUrl;
    
    // Se não temos o áudio, gerar com ElevenLabs e salvar no bucket
    if (!audioUrl) {
      console.log("Gerando novo áudio com ElevenLabs:", voiceId);
      
      // Converter texto para áudio usando ElevenLabs
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "xi-api-key": elevenlabsApiKey,
          },
          body: JSON.stringify({
            text: text,
            model_id: "eleven_multilingual_v1",
            voice_settings: {
              stability: 0.7,
              similarity_boost: 0.8,
              style: 0.4,
              use_speaker_boost: true,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Falha ao gerar áudio: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Obter o áudio como ArrayBuffer
      const audioBuffer = await response.arrayBuffer();
      
      // Salvar o áudio no bucket do Supabase
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('tts_audio')
        .upload(filePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });
        
      if (uploadError) {
        throw new Error(`Erro ao salvar áudio no bucket: ${uploadError.message}`);
      }
      
      // Obter URL pública do áudio
      const { data: publicUrlData } = await supabase
        .storage
        .from('tts_audio')
        .getPublicUrl(filePath);
        
      audioUrl = publicUrlData.publicUrl;
      
      console.log("Áudio gerado e salvo com sucesso. URL:", audioUrl);
    } else {
      console.log("Usando áudio existente no bucket:", audioUrl);
    }

    // Configurar TwiML com tag Play para o áudio
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
</Response>`;

    // Retornar TwiML que o Twilio pode processar
    return new Response(twimlResponse, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/xml" 
      },
    });
  } catch (error) {
    console.error("Erro no handler TTS-Twilio:", error);
    
    // Retornar TwiML de erro
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Ocorreu um erro ao processar esta chamada.</Say>
</Response>`;
    
    return new Response(errorTwiml, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/xml" 
      },
    });
  }
});
