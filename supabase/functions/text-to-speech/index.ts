
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
    const { text, voiceId, model, voice_settings } = await req.json();

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

    // Usar o voiceId fornecido ou um padrão
    const selectedVoiceId = voiceId || "EXAVITQu4vr4xnSDxMaL"; // Sarah - voz feminina de alta qualidade
    // Usar o modelo fornecido ou um padrão
    const selectedModel = model || "eleven_multilingual_v2";

    console.log(`Enviando requisição para Eleven Labs com voice ID ${selectedVoiceId} e modelo ${selectedModel}`);

    // Configurações de voz otimizadas para melhor qualidade
    const settings = {
      stability: voice_settings?.stability ?? 0.75,
      similarity_boost: voice_settings?.similarity_boost ?? 0.85,
      style: voice_settings?.style ?? 0.6,
      use_speaker_boost: voice_settings?.use_speaker_boost ?? true,
    };

    console.log("Configurações de voz:", settings);

    // Fazer a requisição para a API do Eleven Labs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenlabsApiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: selectedModel,
          voice_settings: settings,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Falha ao gerar fala: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        console.error("Erro na API do Eleven Labs:", errorData);
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
