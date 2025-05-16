
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
    const url = new URL(req.url);
    // Obter parâmetros da URL
    const text = url.searchParams.get('text');
    const voiceId = url.searchParams.get('voiceId') || "FGY2WhTYpPnrIDTdsKH5"; // Laura - voz default

    if (!text) {
      throw new Error("Parâmetro text é obrigatório");
    }

    // Obter API key do ElevenLabs
    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!elevenlabsApiKey) {
      throw new Error("ElevenLabs API key não configurada");
    }

    // Converter texto para áudio usando ElevenLabs
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream`,
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

    // Configurar TwiML com a mensagem
    const twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say language="pt-BR">${text}</Say>
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
