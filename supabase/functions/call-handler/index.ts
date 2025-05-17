
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");

// Timeout constant for voice response processing
const MAX_PROCESSING_TIME = 8000; // 8 seconds max for processing

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

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
    // Log request information for debugging
    console.log("\n=== CALL-HANDLER DEBUG INFO ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Request method: ${req.method}`);
    console.log(`Request URL: ${req.url}`);
    console.log(`Agent ID: ${agentId}`);
    console.log(`Agent Name: ${agentName}`);
    console.log(`AI Model: ${aiModel}`);
    console.log(`Voice ID: ${voiceId}`);

    if (req.method === "GET") {
      // Initial connection setup (Twilio's first request)
      console.log("Handling GET request (initial setup)");
      
      // Return a simplified initial response
      const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="pt-BR">Olá, sou o assistente virtual ${agentName}. Como posso ajudar você hoje?</Say>
  <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="5">
    <Say voice="woman" language="pt-BR">Por favor, diga algo para que eu possa ajudar.</Say>
  </Gather>
  <Say voice="woman" language="pt-BR">Não ouvi nada. Até logo.</Say>
  <Hangup/>
</Response>`;
      
      console.log("Returning initial TwiML response");
      
      return new Response(twiml, {
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/xml"
        }
      });
    }
    
    // Parse the request body for POST requests
    const requestData = await req.json().catch(err => {
      console.error("Error parsing request JSON:", err);
      return {};
    });
    
    console.log("Request data received:", JSON.stringify(requestData).substring(0, 200) + "...");
    
    if (requestData.event === "start") {
      console.log("Stream iniciado, sessão estabelecida");
      return new Response(null, { status: 200 });
    }
    
    if (requestData.event === "media") {
      console.log("Received media event, processing speech");
      // Handle speech-to-text for the audio received
      const mediaData = requestData.media?.payload;
      
      if (!mediaData) {
        console.error("No media data received in payload");
        return generateBasicTwimlResponse(
          "Desculpe, não consegui processar o áudio. Vamos tentar novamente?"
        );
      }
      
      try {
        // Start a timeout to ensure we don't exceed Twilio's response time limit
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Processing timeout exceeded")), MAX_PROCESSING_TIME);
        });
        
        // Process the speech with race against timeout
        const processingPromise = processSpeechToTextResponse(mediaData, systemPrompt, voiceId, aiModel);
        
        // Use Promise.race to handle potential timeouts
        const twimlResponse = await Promise.race([
          processingPromise,
          timeoutPromise
        ]);
        
        console.log("Sending TwiML response back to Twilio");
        return new Response(twimlResponse, {
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/xml" 
          }
        });
      } catch (error) {
        console.error("Error processing speech:", error);
        return generateBasicTwimlResponse(
          "Desculpe, tive um problema ao processar sua solicitação. Podemos tentar novamente."
        );
      }
    }
    
    if (requestData.event === "stop") {
      console.log("Stream finalizado");
      return new Response(null, { status: 200 });
    }
    
    // Default response for unhandled events
    console.log("Unhandled event type:", requestData.event);
    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Erro no call-handler:", error);
    return generateErrorResponse(error);
  }
});

/**
 * Process speech to text and generate AI response with TwiML
 */
async function processSpeechToTextResponse(mediaData, systemPrompt, voiceId, aiModel) {
  try {
    console.log("Starting speech to text conversion");
    
    // Use OpenAI's Whisper API for speech recognition
    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY não está configurada");
    }
    
    // Convert Twilio's audio payload to a base64-decoded buffer
    const audioBuffer = Uint8Array.from(atob(mediaData), c => c.charCodeAt(0));
    
    // Create form data for Whisper API
    const formData = new FormData();
    formData.append("file", new Blob([audioBuffer], { type: "audio/wav" }), "speech.wav");
    formData.append("model", "whisper-1");
    formData.append("language", "pt");
    
    console.log("Sending audio to Whisper API");
    const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`
      },
      body: formData
    });
    
    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      console.error("Whisper API error:", errorText);
      throw new Error(`Erro na transcrição: ${whisperResponse.statusText}`);
    }
    
    const transcription = await whisperResponse.json();
    const transcribedText = transcription.text;
    
    console.log(`Transcribed text: "${transcribedText}"`);
    
    // Check for end conversation phrases
    const lowerText = transcribedText.toLowerCase();
    const endPhrases = ["tchau", "adeus", "até logo", "encerrar", "desligar"];
    if (endPhrases.some(phrase => lowerText.includes(phrase))) {
      console.log("End conversation phrase detected");
      return generateEndConversationResponse();
    }
    
    // Process the transcribed text with GPT for conversation
    console.log(`Processing with AI model: ${aiModel}`);
    const gptResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openAIApiKey}`
      },
      body: JSON.stringify({
        model: aiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: transcribedText }
        ],
        max_tokens: 150,
        temperature: 0.7
      })
    });
    
    if (!gptResponse.ok) {
      const errorText = await gptResponse.text();
      console.error("GPT API error:", errorText);
      throw new Error(`Erro na geração de resposta: ${gptResponse.statusText}`);
    }
    
    const gptData = await gptResponse.json();
    const aiResponse = gptData.choices[0].message.content;
    console.log(`AI Response: "${aiResponse}"`);
    
    // Generate TwiML with AI response
    // Using the Say element directly instead of audio is more reliable
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="pt-BR">${aiResponse}</Say>
  <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="5">
    <Say voice="woman" language="pt-BR">Aguardo sua resposta.</Say>
  </Gather>
  <Say voice="woman" language="pt-BR">Não ouvi nada. Até logo.</Say>
  <Hangup/>
</Response>`;
    
    return twiml;
  } catch (error) {
    console.error("Error in processSpeechToTextResponse:", error);
    throw error; // Let the main handler catch and handle the error
  }
}

/**
 * Generate a basic TwiML response with a message
 */
function generateBasicTwimlResponse(message) {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="pt-BR">${message}</Say>
  <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="5">
    <Say voice="woman" language="pt-BR">Pode falar agora.</Say>
  </Gather>
  <Say voice="woman" language="pt-BR">Não ouvi nada. Até logo.</Say>
  <Hangup/>
</Response>`;

  return new Response(twiml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml" }
  });
}

/**
 * Generate a TwiML response for ending the conversation
 */
function generateEndConversationResponse() {
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="pt-BR">Obrigado pelo contato! Foi um prazer atender você. Tenha um ótimo dia!</Say>
  <Hangup/>
</Response>`;

  return twiml;
}

/**
 * Generate an error response
 */
function generateErrorResponse(error) {
  console.error("Generating error response:", error);
  
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="pt-BR">Desculpe, ocorreu um erro no sistema. Por favor, tente novamente mais tarde.</Say>
  <Hangup/>
</Response>`;

  return new Response(twiml, {
    headers: { ...corsHeaders, "Content-Type": "application/xml" },
    status: 200 // Always return 200 to Twilio even for errors
  });
}
