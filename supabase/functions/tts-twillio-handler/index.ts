
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
      - text completo: "${text}"
      - voiceId: ${voiceId}
      - callSid: ${callSid}
    `);

    // Verifica se é um teste ou solicitação real
    console.log(`[DEBUG] TTS-Handler: URL completo: ${req.url}`);
    console.log(`[DEBUG] TTS-Handler: Origem da requisição: ${req.headers.get("origin") || "desconhecida"}`);
    console.log(`[DEBUG] TTS-Handler: User-Agent: ${req.headers.get("user-agent") || "desconhecido"}`);
    // Logar todos os cabeçalhos da requisição para debugging
    console.log(`[DEBUG] TTS-Handler: Headers da requisição: ${JSON.stringify(Object.fromEntries(req.headers))}`);

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
    
    // Verificar se o bucket existe e criar se necessário, garantindo que seja público
    try {
      const { data: bucketData, error: bucketError } = await supabase
        .storage
        .getBucket('tts_audio');
        
      if (bucketError) {
        console.log(`[DEBUG] TTS-Handler: Bucket 'tts_audio' não existe, criando...`);
        
        const { error: createBucketError } = await supabase
          .storage
          .createBucket('tts_audio', { 
            public: true,
            fileSizeLimit: 50000000 // 50MB
          });
          
        if (createBucketError) {
          console.error(`[ERROR] TTS-Handler: Erro ao criar bucket: ${createBucketError.message}`);
          throw new Error(`Erro ao criar bucket de armazenamento: ${createBucketError.message}`);
        } else {
          console.log(`[DEBUG] TTS-Handler: Bucket 'tts_audio' criado com sucesso e definido como público`);
        }
      } else {
        console.log(`[DEBUG] TTS-Handler: Bucket 'tts_audio' já existe`);
        
        // Verificar se o bucket é público e atualizar se necessário
        if (bucketData && !bucketData.public) {
          console.log(`[DEBUG] TTS-Handler: Bucket 'tts_audio' não é público, atualizando...`);
          
          const { error: updateBucketError } = await supabase
            .storage
            .updateBucket('tts_audio', { 
              public: true,
              fileSizeLimit: 50000000 // 50MB  
            });
            
          if (updateBucketError) {
            console.error(`[ERROR] TTS-Handler: Erro ao atualizar bucket: ${updateBucketError.message}`);
          } else {
            console.log(`[DEBUG] TTS-Handler: Bucket 'tts_audio' agora é público`);
          }
        } else {
          console.log(`[DEBUG] TTS-Handler: Bucket 'tts_audio' já é público`);
        }
      }
    } catch (bucketSetupErr) {
      console.error(`[ERROR] TTS-Handler: Erro ao configurar bucket: ${bucketSetupErr}`);
      throw new Error(`Erro na configuração do bucket de armazenamento: ${bucketSetupErr.message}`);
    }
    
    // Forçar remoção de qualquer arquivo existente que possa causar conflito
    try {
      console.log(`[DEBUG] TTS-Handler: Removendo qualquer versão anterior do arquivo para garantir atualização`);
      await supabase
        .storage
        .from('tts_audio')
        .remove([filePath]);
    } catch (removeErr) {
      console.log(`[DEBUG] TTS-Handler: Sem arquivo anterior para remover ou erro não crítico: ${removeErr}`);
    }

    let audioUrl = null;
    
    // Sempre gerar novo áudio para garantir que temos a versão mais recente
    console.log(`[DEBUG] TTS-Handler: Gerando novo áudio com ElevenLabs:
      - voiceId: ${voiceId}
      - modelo: eleven_multilingual_v2
      - texto completo: "${text}"
    `);
    
    // Converter texto para áudio usando ElevenLabs
    console.log("[DEBUG] TTS-Handler: Chamando API da ElevenLabs...");
    const elevenlabsResponse = await fetch(
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

    if (!elevenlabsResponse.ok) {
      const errorText = await elevenlabsResponse.text();
      console.error(`[ERROR] TTS-Handler: Falha na resposta do ElevenLabs: ${elevenlabsResponse.status} ${elevenlabsResponse.statusText} - ${errorText}`);
      throw new Error(`Falha ao gerar áudio com ElevenLabs: ${elevenlabsResponse.status} ${elevenlabsResponse.statusText}`);
    }

    // Obter o áudio como ArrayBuffer
    const audioBuffer = await elevenlabsResponse.arrayBuffer();
    
    console.log(`[DEBUG] TTS-Handler: Áudio gerado com sucesso. Tamanho: ${audioBuffer.byteLength} bytes`);
    
    // Criar diretório do call para manter organizado
    try {
      const { error: dirError } = await supabase
        .storage
        .from('tts_audio')
        .upload(`calls/${callSid}/.keep`, new Uint8Array(0), {
          upsert: true,
          contentType: "text/plain"
        });
        
      if (dirError) {
        console.warn(`[WARN] TTS-Handler: Erro ao criar diretório: ${dirError.message}`);
      }
    } catch (dirErr) {
      console.log(`[DEBUG] TTS-Handler: Erro não crítico ao criar diretório: ${dirErr}`);
    }
    
    // Salvar o áudio no bucket do Supabase com máxima compatibilidade
    console.log(`[DEBUG] TTS-Handler: Salvando áudio no bucket 'tts_audio' em ${filePath}`);
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('tts_audio')
      .upload(filePath, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
        cacheControl: "public, max-age=31536000" // 1 ano de cache
      });
      
    if (uploadError) {
      console.error(`[ERROR] TTS-Handler: Erro ao salvar áudio no bucket: ${uploadError.message}`);
      throw new Error(`Erro ao salvar áudio no bucket: ${uploadError.message}`);
    }
    
    console.log(`[DEBUG] TTS-Handler: Áudio salvo com sucesso no bucket. Dados de upload: ${JSON.stringify(uploadData)}`);
    
    // Obter URL pública do áudio e garantir que seja acessível
    const { data: publicUrlData } = await supabase
      .storage
      .from('tts_audio')
      .getPublicUrl(filePath);
      
    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("Falha ao gerar URL pública para o áudio");
    }
    
    audioUrl = publicUrlData.publicUrl;
    console.log(`[DEBUG] TTS-Handler: URL pública gerada: ${audioUrl}`);
    
    // Teste de ping para a URL do áudio - importante para garantir que está acessível
    try {
      console.log(`[DEBUG] TTS-Handler: Realizando teste de ping para a URL do áudio: ${audioUrl}`);
      const testResponse = await fetch(audioUrl, { 
        method: 'HEAD',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      console.log(`[DEBUG] TTS-Handler: Resultado do ping: ${testResponse.status} ${testResponse.statusText}`);
      console.log(`[DEBUG] TTS-Handler: Headers da resposta: ${JSON.stringify(Object.fromEntries(testResponse.headers))}`);
      
      if (!testResponse.ok) {
        console.error(`[ERROR] TTS-Handler: A URL do áudio não está acessível publicamente (${testResponse.status})`);
        
        // Testar com uma URL reconstruída
        const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
        if (projectId) {
          const reconstructedUrl = `https://${projectId}.supabase.co/storage/v1/object/public/tts_audio/${filePath}`;
          console.log(`[DEBUG] TTS-Handler: Tentando URL reconstruída: ${reconstructedUrl}`);
          
          const retryResponse = await fetch(reconstructedUrl, { method: 'HEAD' });
          if (retryResponse.ok) {
            console.log(`[DEBUG] TTS-Handler: URL reconstruída funciona! Status: ${retryResponse.status}`);
            audioUrl = reconstructedUrl;
          } else {
            console.error(`[ERROR] TTS-Handler: URL reconstruída também falhou. Status: ${retryResponse.status}`);
          }
        }
      } else {
        // Verificar se o Content-Type da resposta é de áudio
        const contentType = testResponse.headers.get('content-type');
        console.log(`[DEBUG] TTS-Handler: Content-Type do arquivo: ${contentType}`);
        
        if (!contentType || !contentType.includes('audio')) {
          console.warn(`[WARNING] TTS-Handler: Content-Type do arquivo não é de áudio: ${contentType}`);
        } else {
          console.log(`[DEBUG] TTS-Handler: Content-Type confirma que é um arquivo de áudio`);
        }
      }
    } catch (pingErr) {
      console.error(`[ERROR] TTS-Handler: Erro ao testar URL do áudio: ${pingErr}`);
    }

    // Garantir que a URL é absoluta
    if (!audioUrl.startsWith('http')) {
      audioUrl = `https:${audioUrl.startsWith('//') ? '' : '//'}${audioUrl}`;
      console.log(`[DEBUG] TTS-Handler: URL com protocolo adicionado: ${audioUrl}`);
    }

    // Generate Direct CDN URL for Twilio
    // Project ID should be available in the Supabase URL: https://{project-id}.supabase.co
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';
    
    if (!projectId) {
      console.warn('[WARN] TTS-Handler: Não foi possível extrair o project ID do Supabase URL');
    }
    
    // Construir uma URL CDN direta que o Twilio possa acessar
    const cdnUrl = `https://${projectId}.supabase.co/storage/v1/object/public/tts_audio/${filePath}`;
    console.log(`[DEBUG] TTS-Handler: URL CDN direta construída: ${cdnUrl}`);
    
    // Teste de ping para a URL CDN
    try {
      console.log(`[DEBUG] TTS-Handler: Realizando teste de ping final para a URL CDN: ${cdnUrl}`);
      const cdnPingResponse = await fetch(cdnUrl, { method: 'HEAD' });
      console.log(`[DEBUG] TTS-Handler: Resultado do ping CDN: ${cdnPingResponse.status} ${cdnPingResponse.statusText}`);
      
      if (cdnPingResponse.ok) {
        console.log('[DEBUG] TTS-Handler: URL CDN verificada e acessível!');
        
        // Use esta URL para o Twilio
        audioUrl = cdnUrl; 
      } else {
        console.error(`[ERROR] TTS-Handler: URL CDN não está acessível: ${cdnPingResponse.status}`);
      }
    } catch (cdnPingErr) {
      console.error(`[ERROR] TTS-Handler: Erro ao testar URL CDN: ${cdnPingErr}`);
    }
    
    // Configurar TwiML com tag Play para o áudio e fallbacks
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${audioUrl}</Play>
  <Say language="pt-BR">Se você está ouvindo esta mensagem em vez do áudio personalizado, significa que o Twilio não conseguiu acessar o URL do áudio: ${audioUrl.substring(0, 100)}</Say>
</Response>`;

    console.log(`[DEBUG] TTS-Handler: URL final do áudio no TwiML: ${audioUrl}`);
    console.log(`[DEBUG] TTS-Handler: Retornando TwiML:
${twimlResponse}
    `);
    
    // Verificar cabeçalhos da resposta
    const responseHeaders = { 
      ...corsHeaders, 
      "Content-Type": "application/xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Audio-URL": audioUrl
    };

    // Retornar TwiML que o Twilio pode processar
    return new Response(twimlResponse, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[ERROR] TTS-Handler: Erro no handler TTS-Twilio: ${error}`);
    
    // Retornar TwiML de erro
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Ocorreu um erro ao processar esta chamada.</Say>
  <Say language="pt-BR">${error.message || "Erro desconhecido"}</Say>
</Response>`;
    
    console.log(`[DEBUG] TTS-Handler: Retornando TwiML de ERRO:
${errorTwiml}
    `);
    
    return new Response(errorTwiml, {
      headers: { 
        ...corsHeaders, 
        "Content-Type": "application/xml" 
      },
    });
  }
});
