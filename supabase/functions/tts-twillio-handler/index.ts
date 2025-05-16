
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

    console.log(`[DEBUG] TTS-Handler: Parâmetros recebidos:
      - text: ${text?.substring(0, 50)}${text?.length && text.length > 50 ? '...' : ''}
      - voiceId: ${voiceId}
      - callSid: ${callSid}
    `);

    // Verifica se é um teste ou solicitação real
    console.log(`[DEBUG] TTS-Handler: URL completo: ${req.url}`);
    console.log(`[DEBUG] TTS-Handler: Origem da requisição: ${req.headers.get("origin") || "desconhecida"}`);
    console.log(`[DEBUG] TTS-Handler: User-Agent: ${req.headers.get("user-agent") || "desconhecido"}`);

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
    // Usando hash do texto para garantir nome seguro de arquivo
    const textHash = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(text)
    ).then(hash => {
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
        .substring(0, 40); // primeiros 40 caracteres do hash
    });
    
    const fileName = `${voiceId}_${textHash}.mp3`;
    const filePath = `calls/${callSid}/${fileName}`;
    
    console.log(`[DEBUG] TTS-Handler: Verificando arquivo de áudio no bucket:
      - fileName: ${fileName}
      - filePath: ${filePath}
      - textHash: ${textHash}
    `);
    
    // Verificar se o arquivo já existe no bucket
    const { data: existingFileData, error: getFileError } = await supabase
      .storage
      .from('tts_audio')
      .list(`calls/${callSid}`, {
        limit: 100,
        search: fileName
      });
    
    let audioUrl = null;
    
    if (getFileError) {
      console.error(`[ERROR] TTS-Handler: Erro ao verificar arquivo existente: ${getFileError.message}`);
    } else if (existingFileData && existingFileData.length > 0) {
      // Arquivo existe, obter URL pública
      const { data: publicUrlData } = await supabase
        .storage
        .from('tts_audio')
        .getPublicUrl(filePath);
      
      audioUrl = publicUrlData?.publicUrl;
      console.log(`[DEBUG] TTS-Handler: Arquivo encontrado no bucket: ${audioUrl}`);
      console.log(`[DEBUG] TTS-Handler: REUTILIZANDO áudio existente.`);
    }
    
    // Se não temos o áudio, gerar com ElevenLabs e salvar no bucket
    if (!audioUrl) {
      console.log(`[DEBUG] TTS-Handler: Gerando NOVO áudio com ElevenLabs:
        - voiceId: ${voiceId}
        - modelo: eleven_multilingual_v2
        - texto completo: "${text}"
      `);
      
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
            model_id: "eleven_multilingual_v2", // Modelo multilíngue mais recente para melhor suporte ao português
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
        console.error(`[ERROR] TTS-Handler: Falha na resposta do ElevenLabs: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Falha ao gerar áudio: ${response.status} ${response.statusText} - ${errorText}`);
      }

      // Obter o áudio como ArrayBuffer
      const audioBuffer = await response.arrayBuffer();
      
      console.log(`[DEBUG] TTS-Handler: Áudio gerado com sucesso. Tamanho: ${audioBuffer.byteLength} bytes`);
      
      // Criar diretório do call para manter organizado
      const { error: dirError } = await supabase
        .storage
        .from('tts_audio')
        .upload(`calls/${callSid}/.keep`, new Uint8Array(0), {
          upsert: true
        });
        
      if (dirError) {
        console.warn(`[WARN] TTS-Handler: Erro ao criar diretório: ${dirError.message}`);
      }
      
      // Salvar o áudio no bucket do Supabase
      const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('tts_audio')
        .upload(filePath, audioBuffer, {
          contentType: 'audio/mpeg',
          upsert: true
        });
        
      if (uploadError) {
        console.error(`[ERROR] TTS-Handler: Erro ao salvar áudio no bucket: ${uploadError.message}`);
        throw new Error(`Erro ao salvar áudio no bucket: ${uploadError.message}`);
      }
      
      // Obter URL pública do áudio
      const { data: publicUrlData } = await supabase
        .storage
        .from('tts_audio')
        .getPublicUrl(filePath);
        
      audioUrl = publicUrlData.publicUrl;
      
      console.log(`[DEBUG] TTS-Handler: Áudio gerado e salvo com sucesso. URL: ${audioUrl}`);
    } else {
      console.log(`[DEBUG] TTS-Handler: Usando áudio existente no bucket: ${audioUrl}`);
    }

    if (!audioUrl) {
      throw new Error("Falha ao gerar URL para o áudio");
    }

    // Configurar TwiML com tag Play para o áudio
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
</Response>`;

    console.log(`[DEBUG] TTS-Handler: Retornando TwiML:
    ${twimlResponse}
    `);

    // Retornar TwiML que o Twilio pode processar
    return new Response(twimlResponse, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/xml" 
      },
    });
  } catch (error) {
    console.error(`[ERROR] TTS-Handler: Erro no handler TTS-Twilio: ${error}`);
    
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
