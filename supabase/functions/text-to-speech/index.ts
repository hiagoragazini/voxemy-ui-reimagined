
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
    console.log("\n=== TEXT-TO-SPEECH DEBUG DIAGNOSTICS ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log("Request body (full):", JSON.stringify(requestBody, null, 2));
    console.log(`Text received: "${text}"`);
    console.log(`Voice ID received: ${voiceId || "não especificado"}`);
    console.log(`Model received: ${model || "não especificado"}`);
    console.log(`Voice settings received: ${JSON.stringify(voice_settings || {}, null, 2)}`);

    if (!text) {
      throw new Error("O texto é obrigatório");
    }

    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenlabsApiKey) {
      throw new Error("A chave de API do Eleven Labs não está configurada");
    }

    console.log(`\nGenerating audio for text: ${text.substring(0, 50)}...`);
    console.log(`Voice ID: ${voiceId || 'usando padrão'}`);
    console.log(`Model: ${model || 'usando padrão'}`);

    // Usar o voiceId fornecido ou um padrão otimizado para português
    const selectedVoiceId = voiceId || "FGY2WhTYpPnrIDTdsKH5"; // Laura - voz feminina otimizada para português
    
    // Usar especificamente o modelo eleven_multilingual_v1 para melhor interpretação de português
    const selectedModel = "eleven_multilingual_v1";
    
    console.log(`Using specific model for Portuguese: ${selectedModel}`);
    console.log(`Selected Voice ID: ${selectedVoiceId}`);
    console.log(`Is it Laura?: ${selectedVoiceId === "FGY2WhTYpPnrIDTdsKH5" ? "YES" : "NO"}`);

    // Configurações de voz otimizadas para português brasileiro
    const settings = {
      stability: voice_settings?.stability ?? 0.7,           // Menor valor para mais naturalidade
      similarity_boost: voice_settings?.similarity_boost ?? 0.8, // Equilibrado para identidade vocal
      style: voice_settings?.style ?? 0.4,                  // Valor baixo para reduzir o som robótico
      use_speaker_boost: voice_settings?.use_speaker_boost ?? true,
    };

    console.log("Final voice settings:", JSON.stringify(settings, null, 2));

    // Preparar payload completo para verificação
    const payload = {
      text: text,
      model_id: selectedModel, // Fixando o modelo para interpretar português corretamente
      voice_settings: settings,
    };
    
    console.log("\nFinal API payload for ElevenLabs:", JSON.stringify(payload, null, 2));
    console.log("API URL:", `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`);

    // Fazer a requisição para a API do Eleven Labs
    console.log("\nSending request to ElevenLabs API...");
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

    console.log(`\nElevenLabs response status: ${response.status} ${response.statusText}`);
    console.log("Response headers:", JSON.stringify(Object.fromEntries(response.headers), null, 2));

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Failed to generate speech: ${response.status} ${response.statusText}`;
      
      try {
        const errorData = JSON.parse(errorText);
        console.error("ElevenLabs API error:", JSON.stringify(errorData, null, 2));
        if (errorData.detail && errorData.detail.message) {
          errorMessage = `ElevenLabs Error: ${errorData.detail.message}`;
        }
      } catch (e) {
        console.error("Error processing error response:", errorText);
      }
      
      throw new Error(errorMessage);
    }

    // Obter o buffer de áudio
    const audioBuffer = await response.arrayBuffer();
    
    // Verificar se temos dados de áudio
    if (audioBuffer.byteLength === 0) {
      throw new Error("ElevenLabs returned an empty audio file");
    }
    
    // Logar o tamanho dos dados para verificação
    console.log(`\nAudio generated successfully, size: ${audioBuffer.byteLength} bytes`);
    
    // Converter para base64 para transporte seguro
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );
    
    // Logar o tamanho do base64 para verificação
    console.log(`Base64 size: ${base64Audio.length}`);

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
    console.error("Error in text-to-speech function:", error);
    console.error("Stack trace:", error.stack);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Error processing request",
        timestamp: new Date().toISOString()
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
