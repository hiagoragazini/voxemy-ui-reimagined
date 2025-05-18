
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// ElevenLabs API settings
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const ELEVENLABS_API_URL = "https://api.elevenlabs.io/v1/text-to-speech";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("\n=== VAPI-TEXT-TO-SPEECH HANDLER ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    
    if (!ELEVENLABS_API_KEY) {
      throw new Error("ELEVENLABS_API_KEY is not configured");
    }
    
    // Extract request data
    const { text, voiceId, model, voice_settings } = await req.json();
    
    if (!text) {
      throw new Error("Text is required");
    }
    
    console.log("Text to convert:", text);
    console.log("Voice ID:", voiceId);
    
    const voice = voiceId || "FGY2WhTYpPnrIDTdsKH5"; // Default to Laura (Portuguese)
    const apiModel = model || "eleven_multilingual_v1";
    
    // Default voice settings if not provided
    const defaultVoiceSettings = {
      stability: 0.7,
      similarity_boost: 0.8,
      style: 0.4,
      use_speaker_boost: true
    };
    
    // Call ElevenLabs API
    const response = await fetch(`${ELEVENLABS_API_URL}/${voice}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY
      },
      body: JSON.stringify({
        text,
        model_id: apiModel,
        voice_settings: voice_settings || defaultVoiceSettings
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", errorText);
      throw new Error(`ElevenLabs API error (${response.status}): ${errorText}`);
    }
    
    // Get audio data as ArrayBuffer
    const audioArrayBuffer = await response.arrayBuffer();
    
    // Convert ArrayBuffer to base64
    const audioUint8Array = new Uint8Array(audioArrayBuffer);
    let binaryString = "";
    audioUint8Array.forEach(byte => {
      binaryString += String.fromCharCode(byte);
    });
    const audioBase64 = btoa(binaryString);
    
    console.log("Audio generated successfully, size:", audioArrayBuffer.byteLength);
    
    return new Response(
      JSON.stringify({
        success: true,
        audioContent: audioBase64,
        metadata: {
          format: "mp3",
          voiceId: voice,
          model: apiModel,
          contentLength: audioArrayBuffer.byteLength
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error in vapi-text-to-speech:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
