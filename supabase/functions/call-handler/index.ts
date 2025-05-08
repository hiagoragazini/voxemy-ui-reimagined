
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Extract URL parameters
  const url = new URL(req.url);
  const agentId = url.searchParams.get("agentId");
  const agentName = url.searchParams.get("agentName") || "Assistente Virtual";
  const aiModel = url.searchParams.get("aiModel") || "gpt-4o-mini";
  const voiceId = url.searchParams.get("voiceId") || "EXAVITQu4vr4xnSDxMaL"; // Sarah padrão
  const systemPromptEncoded = url.searchParams.get("systemPrompt");
  
  // Decode system prompt if provided
  const systemPrompt = systemPromptEncoded ? 
    decodeURIComponent(systemPromptEncoded) : 
    `Você é ${agentName}, um assistente virtual para atendimento ao cliente. Seja educado, conciso e útil. Mantenha suas respostas diretas e claras.`;

  try {
    if (req.method === "GET") {
      // Initial connection setup (Twilio's first request)
      const responseBody = {
        start: {
          streamSid: "initial",
          accountSid: "initial",
          callSid: "initial",
        },
      };
      
      return new Response(JSON.stringify(responseBody), {
        headers: { "Content-Type": "application/json" },
      });
    }
    
    // Parse the request body as a readable stream
    const requestData = await req.json();
    
    if (requestData.event === "start") {
      console.log("Stream iniciado, sessão estabelecida");
      return new Response(null, { status: 200 });
    }
    
    if (requestData.event === "media") {
      // Handle speech-to-text for the audio received
      const mediaData = requestData.media.payload;
      
      try {
        // Use OpenAI's Whisper API for speech recognition
        const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
        if (!openAIApiKey) {
          throw new Error("OPENAI_API_KEY não está configurada");
        }
        
        // Convert Twilio's audio payload to a base64 audio blob
        // Note: For production, you would need to convert the payload to an audio file format like mp3 or wav
        // This is a simplified example
        
        // Process the speech with OpenAI Whisper
        const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${openAIApiKey}`,
          },
          body: new FormData([
            ["file", new Blob([mediaData], { type: "audio/wav" }), "speech.wav"],
            ["model", "whisper-1"],
            ["language", "pt"],
          ]),
        });
        
        if (!whisperResponse.ok) {
          throw new Error(`Erro na transcrição: ${whisperResponse.statusText}`);
        }
        
        const transcription = await whisperResponse.json();
        const transcribedText = transcription.text;
        
        // Process the transcribed text with GPT for conversation
        const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${openAIApiKey}`,
          },
          body: JSON.stringify({
            model: aiModel,
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: transcribedText }
            ],
          }),
        });
        
        if (!gptResponse.ok) {
          throw new Error(`Erro na geração de resposta: ${gptResponse.statusText}`);
        }
        
        const gptData = await gptResponse.json();
        const aiResponse = gptData.choices[0].message.content;
        
        // Convert AI text response to speech using Eleven Labs
        const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
        if (!elevenlabsApiKey) {
          throw new Error("ELEVENLABS_API_KEY não está configurada");
        }
        
        const ttsResponse = await fetch(
          `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "xi-api-key": elevenlabsApiKey,
            },
            body: JSON.stringify({
              text: aiResponse,
              model_id: "eleven_multilingual_v2",
              voice_settings: {
                stability: 0.75,
                similarity_boost: 0.85,
                style: 0.6,
                use_speaker_boost: true,
              },
            }),
          }
        );
        
        if (!ttsResponse.ok) {
          throw new Error(`Erro na síntese de voz: ${ttsResponse.statusText}`);
        }
        
        // Get audio buffer and convert to base64 for Twilio
        const audioBuffer = await ttsResponse.arrayBuffer();
        const base64Audio = btoa(
          String.fromCharCode(...new Uint8Array(audioBuffer))
        );
        
        // Send the audio response back to Twilio
        return new Response(
          JSON.stringify({
            streamSid: requestData.streamSid,
            event: "media",
            media: {
              payload: base64Audio,
            },
          }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch (error) {
        console.error("Erro ao processar fala:", error);
        return new Response(null, { status: 500 });
      }
    }
    
    if (requestData.event === "stop") {
      console.log("Stream finalizado");
      return new Response(null, { status: 200 });
    }
    
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Erro no call-handler:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno no servidor" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
