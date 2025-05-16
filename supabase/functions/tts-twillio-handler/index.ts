
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
    // Usar voz Antônio (pt-BR) da ElevenLabs para garantir compatibilidade com português
    const voiceId = url.searchParams.get('voiceId') || "21m00Tcm4TlvDq8ikWAM";
    const callSid = url.searchParams.get('callSid') || `manual-${Date.now()}`;

    console.log(`[DEBUG] TTS-Handler: Parâmetros recebidos:
      - text: ${text?.substring(0, 50)}${text?.length && text.length > 50 ? '...' : ''}
      - text completo: "${text}"
      - text decodificado: "${text ? decodeURIComponent(text) : ''}"
      - voiceId: ${voiceId}
      - callSid: ${callSid}
      - URL completa: ${req.url}
    `);

    // Verifica se é um teste ou solicitação real
    console.log(`[DEBUG] TTS-Handler: URL completo: ${req.url}`);
    console.log(`[DEBUG] TTS-Handler: Origem da requisição: ${req.headers.get("origin") || "desconhecida"}`);
    console.log(`[DEBUG] TTS-Handler: User-Agent: ${req.headers.get("user-agent") || "desconhecido"}`);
    // Logar todos os cabeçalhos da requisição para debugging
    console.log(`[DEBUG] TTS-Handler: Headers da requisição: ${JSON.stringify(Object.fromEntries(req.headers))}`);

    if (!text) {
      const errorMessage = "Parâmetro text é obrigatório e está ausente na requisição";
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
      new TextEncoder().encode(decodedText)
    ).then(hash => {
      return Array.from(new Uint8Array(hash))
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
        .substring(0, 40); // primeiros 40 caracteres do hash
    });
    
    console.log(`[DEBUG] TTS-Handler: Hash gerado para o texto: ${textHash}`);
    
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
      - voiceId: ${voiceId} (Antônio - pt-BR)
      - modelo: eleven_multilingual_v2
      - texto decodificado: "${decodedText}"
      - tamanho do texto: ${decodedText.length} caracteres
    `);
    
    // Converter texto para áudio usando ElevenLabs
    console.log("[DEBUG] TTS-Handler: Chamando API da ElevenLabs...");
    
    // NOVO: Testar a API com chamada de OPTIONS primeiro para verificar conectividade
    try {
      const testResponse = await fetch("https://api.elevenlabs.io/v1/text-to-speech/test", { 
        method: 'OPTIONS'
      });
      console.log(`[DEBUG] TTS-Handler: Teste de conectividade com ElevenLabs: ${testResponse.status} ${testResponse.statusText}`);
    } catch (testErr) {
      console.warn(`[WARN] TTS-Handler: Teste de conectividade com ElevenLabs falhou: ${testErr}`);
    }
    
    // Fazer a requisição real para geração de áudio
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

    // NOVO: Verificar headers da resposta para diagnosticar possíveis problemas
    console.log(`[DEBUG] TTS-Handler: Headers da resposta ElevenLabs: ${JSON.stringify(Object.fromEntries(elevenlabsResponse.headers))}`);
    
    // Obter o áudio como ArrayBuffer
    const audioBuffer = await elevenlabsResponse.arrayBuffer();
    
    console.log(`[DEBUG] TTS-Handler: Áudio gerado com sucesso. Tamanho: ${audioBuffer.byteLength} bytes`);
    if (audioBuffer.byteLength < 1000) {
      console.error(`[ERROR] TTS-Handler: Áudio gerado é muito pequeno (${audioBuffer.byteLength} bytes), pode indicar erro`);
    }
    
    // NOVO: Validar se o conteúdo parece ser realmente um MP3
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
    
    // NOVO: Gerar um ID único para essa versão do arquivo para evitar problemas de cache
    const uniqueId = Date.now();
    const uniqueFileName = `${voiceId}_${textHash}_${uniqueId}.mp3`;
    const uniqueFilePath = `calls/${callSid}/${uniqueFileName}`;
    
    // Salvar o áudio no bucket do Supabase com máxima compatibilidade
    console.log(`[DEBUG] TTS-Handler: Salvando áudio no bucket 'tts_audio' em ${uniqueFilePath}`);
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('tts_audio')
      .upload(uniqueFilePath, audioBuffer, {
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
      .getPublicUrl(uniqueFilePath);
      
    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("Falha ao gerar URL pública para o áudio");
    }
    
    audioUrl = publicUrlData.publicUrl;
    console.log(`[DEBUG] TTS-Handler: URL pública gerada: ${audioUrl}`);
    
    // NOVA ABORDAGEM: Construir URL diretas para o Twilio
    // Project ID should be available in the Supabase URL: https://{project-id}.supabase.co
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] || '';
    
    if (!projectId) {
      console.warn('[WARN] TTS-Handler: Não foi possível extrair o project ID do Supabase URL');
    }
    
    // Construir todas as possíveis variantes de URLs para testing
    const cdnUrl = `https://${projectId}.supabase.co/storage/v1/object/public/tts_audio/${uniqueFilePath}`;
    const cdnUrl2 = `${supabaseUrl}/storage/v1/object/public/tts_audio/${uniqueFilePath}`;
    const cdnUrl3 = `https://nklbbeavnbwvvatqimxw.supabase.co/storage/v1/object/public/tts_audio/${uniqueFilePath}`;
    
    // NOVO: Testar várias formas de URLs para verificar qual funciona melhor
    const urlsToTest = [
      { name: "URL padrão", url: audioUrl },
      { name: "CDN URL 1", url: cdnUrl },
      { name: "CDN URL 2", url: cdnUrl2 },
      { name: "CDN URL 3", url: cdnUrl3 },
    ];
    
    console.log("[DEBUG] TTS-Handler: Testando múltiplas variantes de URLs para encontrar a mais compatível");
    
    let bestUrl = null;
    let bestUrlName = null;
    
    // TESTE INTENSIVO: Verificar qual URL tem melhor compatibilidade
    for (const urlData of urlsToTest) {
      try {
        console.log(`[DEBUG] TTS-Handler: Testando ${urlData.name}: ${urlData.url}`);
        const testResponse = await fetch(urlData.url, { 
          method: 'HEAD',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });
        
        const contentType = testResponse.headers.get('content-type');
        const contentLength = testResponse.headers.get('content-length');
        
        console.log(`[DEBUG] TTS-Handler: ${urlData.name} - Status: ${testResponse.status}, Content-Type: ${contentType}, Size: ${contentLength} bytes`);
        
        if (testResponse.ok && contentType && contentType.includes('audio') && 
            parseInt(contentLength || '0', 10) > 1000) {
          console.log(`[DEBUG] TTS-Handler: ${urlData.name} VALIDADA com SUCESSO!`);
          bestUrl = urlData.url;
          bestUrlName = urlData.name;
          break;
        } else {
          console.log(`[DEBUG] TTS-Handler: ${urlData.name} não atendeu aos critérios de validação`);
        }
      } catch (urlTestErr) {
        console.error(`[ERROR] TTS-Handler: Erro testando ${urlData.name}: ${urlTestErr}`);
      }
    }
    
    // Se nenhuma URL passou nos testes, usar a URL CDN direta como último recurso
    if (!bestUrl) {
      console.warn(`[WARN] TTS-Handler: Nenhuma URL validada com sucesso. Usando CDN URL como fallback.`);
      bestUrl = cdnUrl3;
      bestUrlName = "CDN URL (fallback)";
    }
    
    console.log(`[DEBUG] TTS-Handler: URL selecionada para Twilio: ${bestUrlName} - ${bestUrl}`);
    audioUrl = bestUrl;
    
    // NOVO TESTE FINAL: Verificar se o áudio é realmente acessível via GET
    try {
      console.log(`[DEBUG] TTS-Handler: Verificando download completo do áudio via ${bestUrlName}`);
      const finalTest = await fetch(audioUrl);
      
      if (finalTest.ok) {
        const audioData = await finalTest.arrayBuffer();
        console.log(`[DEBUG] TTS-Handler: Download completo bem-sucedido! Tamanho: ${audioData.byteLength} bytes`);
        
        if (audioData.byteLength < 1000) {
          console.error(`[ERROR] TTS-Handler: Arquivo baixado é muito pequeno (${audioData.byteLength} bytes)`);
        } else {
          console.log(`[DEBUG] TTS-Handler: Arquivo de áudio validado e pronto para uso!`);
        }
        
        // Verificar headers completos da resposta final
        console.log(`[DEBUG] TTS-Handler: Headers da resposta final: ${JSON.stringify(Object.fromEntries(finalTest.headers))}`);
      } else {
        console.error(`[ERROR] TTS-Handler: Falha no teste final de download: ${finalTest.status} ${finalTest.statusText}`);
      }
    } catch (finalTestErr) {
      console.error(`[ERROR] TTS-Handler: Erro no teste final de download: ${finalTestErr}`);
    }
    
    // NOVO: Usar URL parametrizada para Twilio com timestamp para evitar cache
    const twimlUrl = `${audioUrl}?t=${Date.now()}`;
    
    // Configurar TwiML com tag Play para o áudio e fallbacks detalhados
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Play>${twimlUrl}</Play>
  <Say language="pt-BR">Se você está ouvindo esta mensagem em vez do áudio personalizado, significa que o Twilio não conseguiu acessar o URL do áudio: ${audioUrl.substring(0, 100)}</Say>
  <Pause length="1"/>
  <Say language="pt-BR">Tamanho do áudio gerado: ${audioBuffer.byteLength} bytes. Hash do texto: ${textHash}</Say>
</Response>`;

    console.log(`[DEBUG] TTS-Handler: URL final do áudio no TwiML: ${twimlUrl}`);
    console.log(`[DEBUG] TTS-Handler: Texto original decodificado: "${decodedText}"`);
    console.log(`[DEBUG] TTS-Handler: Retornando TwiML:
${twimlResponse}
    `);
    
    // Verificar cabeçalhos da resposta
    const responseHeaders = { 
      ...corsHeaders, 
      "Content-Type": "application/xml",
      "Cache-Control": "no-cache, no-store, must-revalidate",
      "X-Audio-URL": audioUrl,
      "X-Audio-Size": audioBuffer.byteLength.toString(),
      "X-Text-Hash": textHash,
      "X-Text-Length": decodedText.length.toString(),
    };

    // Retornar TwiML que o Twilio pode processar
    return new Response(twimlResponse, {
      headers: responseHeaders,
    });
  } catch (error) {
    console.error(`[ERROR] TTS-Handler: Erro no handler TTS-Twilio: ${error}`);
    
    // Retornar TwiML de erro mais detalhado
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">Ocorreu um erro ao processar esta chamada.</Say>
  <Say language="pt-BR">${error.message || "Erro desconhecido"}</Say>
  <Say language="pt-BR">Por favor, verifique os logs para mais detalhes.</Say>
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
