import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

// Updated method for importing Twilio compatible with Deno
async function getTwilioClient(accountSid, authToken) {
  try {
    // Import Twilio using a compatible ESM import for Deno
    const twilio = await import("npm:twilio@4.20.0");
    return new twilio.default(accountSid, authToken);
  } catch (error) {
    console.error("Error initializing Twilio client:", error);
    throw new Error(`Failed to initialize Twilio client: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse request body
    const requestBody = await req.json();

    // If it's just a test, don't make the call, just return that the function is accessible
    if (requestBody.test === true) {
      console.log("Connectivity test for make-call function");
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "make-call function is accessible",
          env: {
            twilioAccountSidConfigured: Boolean(Deno.env.get("TWILIO_ACCOUNT_SID")),
            twilioAuthTokenConfigured: Boolean(Deno.env.get("TWILIO_AUTH_TOKEN")),
            twilioPhoneNumberConfigured: Boolean(Deno.env.get("TWILIO_PHONE_NUMBER"))
          }
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if Twilio credentials are configured
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhone = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    if (!twilioAccountSid || !twilioAuthToken) {
      throw new Error("Twilio credentials are not configured in environment variables");
    }

    if (!twilioPhone) {
      console.warn("Twilio phone number not configured. Please set the TWILIO_PHONE_NUMBER variable.");
      throw new Error("Twilio phone number (TWILIO_PHONE_NUMBER) is not configured in environment variables");
    }

    // Log with masked credentials for security
    console.log(`Using Twilio credentials: SID: ${twilioAccountSid.substring(0, 5)}...${twilioAccountSid.substring(twilioAccountSid.length - 4)}`);
    console.log(`Using Twilio phone number: ${twilioPhone}`);

    // Get request data
    const { 
      phoneNumber, 
      callbackUrl,
      agentId,
      campaignId,
      agentName,
      leadId,
      useAI = true,
      aiModel = "gpt-4o-mini",
      systemPrompt,
      voiceId,
      twimlInstructions,
      recordCall = true,
      transcribeCall = true
    } = requestBody;

    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    console.log(`Starting call to ${phoneNumber}`);

    try {
      // Initialize Twilio client with improved error handling
      console.log("Starting Twilio client creation...");
      const client = await getTwilioClient(twilioAccountSid, twilioAuthToken);
      console.log("Twilio client created successfully");

      // Format the number to international format
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      console.log(`Formatted number: ${formattedPhoneNumber}`);
      
      // Base URL for functions
      const baseUrl = Deno.env.get("SUPABASE_URL") || "";
      if (!baseUrl) {
        console.warn("Supabase URL not configured, callback links may not work properly");
      }
      
      // Create TwiML for the call
      let twiml = twimlInstructions;
      if (!twiml) {
        // Se temos um texto personalizado e ElevenLabs está configurado, usar voz de alta qualidade
        if (requestBody.message && Deno.env.get("ELEVENLABS_API_KEY")) {
          try {
            // Gerar áudio com ElevenLabs
            const text = requestBody.message;
            // Usar voiceId definido ou um padrão de qualidade
            const selectedVoiceId = voiceId || "EXAVITQu4vr4xnSDxMaL"; // Sarah - voz feminina de alta qualidade
            
            // Configurações de voz otimizadas para telefonia
            const settings = {
              stability: 0.75,
              similarity_boost: 0.85,
              style: 0.6,
              use_speaker_boost: true
            };
            
            console.log("Gerando áudio de alta qualidade com ElevenLabs para:", text.substring(0, 50) + "...");
            
            // Fazer a requisição para nossa função Edge do ElevenLabs
            const { data, error } = await fetch(`${baseUrl}/functions/v1/text-to-speech`, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
              },
              body: JSON.stringify({
                text,
                voiceId: selectedVoiceId,
                model: "eleven_multilingual_v2",
                voice_settings: settings
              }),
            }).then(r => r.json());
            
            if (error) {
              console.error("Erro ao gerar áudio com ElevenLabs:", error);
              throw new Error("Falha ao gerar áudio: " + error);
            }
            
            if (!data.success) {
              console.error("ElevenLabs retornou erro:", data.error);
              throw new Error(data.error || "Falha ao gerar áudio");
            }
            
            // Usar o áudio gerado pela ElevenLabs no TwiML
            const audioUrl = `data:audio/mp3;base64,${data.audioContent}`;
            
            twiml = `
              <Response>
                <Play>${audioUrl}</Play>
              </Response>
            `;
            
            console.log("Áudio ElevenLabs gerado e adicionado ao TwiML");
          } catch (audioError) {
            console.error("Erro ao gerar áudio com ElevenLabs:", audioError);
            // Fallback para TTS padrão do Twilio em caso de erro
            twiml = `
              <Response>
                <Say language="pt-BR">${requestBody.message}</Say>
              </Response>
            `;
            console.log("Usando TTS padrão do Twilio como fallback");
          }
        } else {
          // Fallback para TTS padrão do Twilio
          twiml = requestBody.message ? 
            `
              <Response>
                <Say language="pt-BR">${requestBody.message}</Say>
              </Response>
            ` : 
            `
              <Response>
                <Say language="pt-BR">Olá, esta é uma chamada automatizada. Obrigado por atender.</Say>
                <Pause length="1"/>
                <Say language="pt-BR">Esta é uma demonstração da Voxemy.</Say>
                ${recordCall ? '<Record action="' + baseUrl + '/functions/v1/call-record-callback" recordingStatusCallback="' + baseUrl + '/functions/v1/call-record-status" recordingStatusCallbackMethod="POST" />' : ''}
              </Response>
            `;
        }
      }

      // Log the configured TwiML for debugging
      console.log(`TwiML configured: ${twiml.substring(0, 100)}...`);

      // Parameters for the callback URL
      let callbackParams = '';
      if (callbackUrl) {
        if (agentId) callbackParams += `&agentId=${agentId}`;
        if (campaignId) callbackParams += `&campaignId=${campaignId}`;
        if (leadId) callbackParams += `&leadId=${leadId}`;
        if (recordCall) callbackParams += `&recordCall=true`;
        if (transcribeCall) callbackParams += `&transcribeCall=true`;
        
        // Add parameters to the callback URL if there are any
        const finalCallbackUrl = callbackParams 
          ? `${callbackUrl}${callbackUrl.includes('?') ? '&' : '?'}${callbackParams.substring(1)}`
          : callbackUrl;
          
        console.log(`Callback URL configured: ${finalCallbackUrl}`);
      } else {
        console.log("No callback URL provided");
      }

      // Get the Twilio phone number from environment variables
      console.log(`Using Twilio number: ${twilioPhone}`);
      
      // Make the call with improved error handling
      try {
        console.log("Creating call via Twilio API...");
        const call = await client.calls.create({
          twiml: twiml,
          to: formattedPhoneNumber,
          from: twilioPhone, // Use the number configured in environment variables
          statusCallback: callbackUrl || undefined,
          statusCallbackEvent: callbackUrl ? ['initiated', 'ringing', 'answered', 'completed'] : undefined,
          statusCallbackMethod: 'POST',
          record: recordCall,
        });
        
        console.log("Call created successfully:", call.sid);
        console.log("Initial call status:", call.status);
        
        // Update lead status if leadId is provided
        if (leadId) {
          try {
            const supabaseUrl = Deno.env.get("SUPABASE_URL");
            const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
            
            if (supabaseUrl && supabaseKey) {
              const supabase = createClient(supabaseUrl, supabaseKey);
              
              await supabase
                .from("leads")
                .update({ 
                  status: "called",
                  call_result: "Call started"
                })
                .eq("id", leadId);
                
              console.log(`Status of lead ${leadId} updated to 'called'`);
              
              // Create initial call log entry
              await supabase.from("call_logs").insert({
                call_sid: call.sid,
                status: call.status,
                from_number: twilioPhone,
                to_number: formattedPhoneNumber,
                agent_id: agentId,
                campaign_id: campaignId,
                lead_id: leadId
              });
              
              console.log(`Initial call log created for SID: ${call.sid}`);
            } else {
              console.warn("Supabase credentials not found, could not update lead status");
            }
          } catch (err) {
            console.error("Error updating lead status:", err);
            // Don't fail the whole request if this fails
          }
        }

        return new Response(
          JSON.stringify({ 
            success: true, 
            callSid: call.sid,
            status: call.status
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      } catch (twilioError) {
        console.error("Twilio error:", twilioError);
        
        // Detailed error logging
        console.error("Error code:", twilioError.code);
        console.error("Error message:", twilioError.message);
        console.error("Status:", twilioError.status);
        console.error("Stack trace:", twilioError.stack);
        
        if (twilioError.moreInfo) {
          console.error("More information:", twilioError.moreInfo);
        }
        
        // Enhanced error reporting
        const errorDetails = {
          message: twilioError.message || "Unknown Twilio error",
          code: twilioError.code,
          moreInfo: twilioError.moreInfo,
          status: twilioError.status
        };
        
        throw new Error(`Twilio Error: ${JSON.stringify(errorDetails)}`);
      }
    } catch (twilioSetupError) {
      console.error("Error in Twilio setup:", twilioSetupError);
      throw new Error(`Failed to set up Twilio client: ${twilioSetupError.message}`);
    }
  } catch (error) {
    console.error("Error making call:", error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Error processing request" 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

// Function to format phone number to international format
function formatPhoneNumber(phoneNumber: string): string {
  // Remove non-numeric characters
  let cleaned = phoneNumber.replace(/\D/g, '');
  
  // If starts with 0, remove it
  if (cleaned.startsWith('0')) {
    cleaned = cleaned.substring(1);
  }
  
  // Handle numbers specifically for Brazil
  if (cleaned.length === 11 || cleaned.length === 10) {
    // If doesn't start with +, add Brazil country code (+55)
    if (!phoneNumber.startsWith('+')) {
      // If already starts with 55, just add the +
      if (cleaned.startsWith('55')) {
        cleaned = '+' + cleaned;
      } else {
        cleaned = '+55' + cleaned;
      }
    }
  } else {
    // For international numbers, just add + if it doesn't exist
    if (!phoneNumber.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
  }
  
  console.log(`Original number: ${phoneNumber}, Formatted: ${cleaned}`);
  return cleaned;
}
