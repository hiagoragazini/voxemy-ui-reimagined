
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
    const { text, voiceId, model } = await req.json();

    if (!text) {
      throw new Error("O texto é obrigatório");
    }

    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenlabsApiKey) {
      throw new Error("A chave de API do Eleven Labs não está configurada");
    }

    console.log(`Gerando áudio para o texto: ${text.substring(0, 50)}...`);

    // Usar o voiceId fornecido ou um padrão
    const selectedVoiceId = voiceId || "pFZP5JQG7iQjIQuC4Bku"; // Lily - voz padrão
    // Usar o modelo fornecido ou um padrão
    const selectedModel = model || "eleven_multilingual_v2";

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
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("Erro na API do Eleven Labs:", errorData);
      throw new Error(
        `Falha ao gerar fala: ${response.status} ${response.statusText}`
      );
    }

    // Obter o buffer de áudio
    const audioBuffer = await response.arrayBuffer();
    // Converter para base64 para transporte seguro
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        audioContent: base64Audio 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função text-to-speech:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro ao processar a solicitação" 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
