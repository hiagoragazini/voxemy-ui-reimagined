
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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
    const requestBody = await req.json();
    const { text, voiceId, model, voice_settings } = requestBody;

    // Log de diagnóstico detalhado
    console.log("=== TEXT-TO-SPEECH DIAGNÓSTICO ===");
    console.log("Corpo da requisição completo:", JSON.stringify(requestBody));
    console.log(`Texto recebido: "${text}"`);
    console.log(`Voice ID recebido: ${voiceId || "não especificado"}`);
    console.log(`Modelo recebido: ${model || "não especificado"}`);
    console.log(`Voice settings recebidos: ${JSON.stringify(voice_settings || {})}`);

    if (!text) {
      throw new Error("O texto é obrigatório");
    }

    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenlabsApiKey) {
      throw new Error("A chave de API do Eleven Labs não está configurada");
    }

    console.log(`Gerando áudio para o texto: ${text.substring(0, 50)}...`);
    console.log(`Voice ID: ${voiceId || 'usando padrão'}`);
    console.log(`Model: ${model || 'usando padrão'}`);

    // Usar o voiceId fornecido ou um padrão otimizado para português
    const selectedVoiceId = voiceId || "FGY2WhTYpPnrIDTdsKH5"; // Laura - voz feminina otimizada para português
    
    // Usar especificamente o modelo eleven_multilingual_v1 para melhor interpretação de português
    // Conforme solicitado pelo usuário
    const selectedModel = "eleven_multilingual_v1";
    
    console.log(`Usando modelo específico para português: ${selectedModel}`);
    console.log(`Voice ID final selecionado: ${selectedVoiceId}`);
    console.log(`É a voz Laura?: ${selectedVoiceId === "FGY2WhTYpPnrIDTdsKH5" ? "SIM" : "NÃO"}`);

    // Configurações de voz otimizadas para português brasileiro
    const settings = {
      stability: voice_settings?.stability ?? 0.7,           // Menor valor para mais naturalidade
      similarity_boost: voice_settings?.similarity_boost ?? 0.8, // Equilibrado para identidade vocal
      style: voice_settings?.style ?? 0.4,                  // Valor baixo para reduzir o som robótico
      use_speaker_boost: voice_settings?.use_speaker_boost ?? true,
    };

    console.log("Configurações de voz finais:", JSON.stringify(settings));

    // Preparar payload completo para verificação
    const payload = {
      text: text,
      model_id: selectedModel, // Fixando o modelo para interpretar português corretamente
      voice_settings: settings,
    };
    
    console.log("Payload para API ElevenLabs:", JSON.stringify(payload));

    // Fazer a requisição para a API do Eleven Labs
    // Explicitamente definindo o model_id como eleven_multilingual_v1 para garantir interpretação em português
    console.log("Enviando requisição para ElevenLabs API...");
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenlabsApiKey,
        },
        body: JSON.stringify(payload),
      }
    );

    console.log(`Status da resposta ElevenLabs: ${response.status}`);
    console.log("Headers da resposta:", JSON.stringify(Object.fromEntries(response.headers)));

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Falha ao gerar fala: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        console.error("Erro na API do Eleven Labs:", JSON.stringify(errorData));
        if (errorData.detail && errorData.detail.message) {
          errorMessage = `Erro do Eleven Labs: ${errorData.detail.message}`;
        }
      } catch (e) {
        console.error("Erro ao processar resposta de erro:", errorText);
      }
      
      throw new Error(errorMessage);
    }

    // Obter o buffer de áudio
    const audioBuffer = await response.arrayBuffer();
    
    // Verificar se temos dados de áudio
    if (audioBuffer.byteLength === 0) {
      throw new Error("Eleven Labs retornou um arquivo de áudio vazio");
    }
    
    // Logar o tamanho dos dados para verificação
    console.log("Áudio gerado com sucesso, tamanho:", audioBuffer.byteLength, "bytes");
    
    // Converter para base64 para transporte seguro
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );
    
    // Logar o tamanho do base64 para verificação
    console.log("Tamanho do base64:", base64Audio.length);

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioContent: base64Audio,
        metadata: {
          voiceId: selectedVoiceId,
          model: selectedModel,
          textLength: text.length,
          audioSize: audioBuffer.byteLength,
          format: "mp3",
          base64Length: base64Audio.length,
          settings,
          timestamp: new Date().toISOString()
        }
      }),
      {
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        },
      }
    );
  } catch (error) {
    console.error("Erro na função text-to-speech:", error);
    console.error("Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro ao processar a solicitação",
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
