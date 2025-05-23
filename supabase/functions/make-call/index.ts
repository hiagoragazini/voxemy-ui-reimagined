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

// Validar URLs de áudio antes de usar no Twilio
async function validateAudioUrl(url) {
  try {
    console.log(`\n[DEBUG] Validando URL de áudio: ${url}`);
    const response = await fetch(url, { 
      method: 'HEAD',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      }
    });
    
    if (!response.ok) {
      console.error(`[ERROR] URL de áudio inválida: ${response.status} ${response.statusText}`);
      return { valid: false, status: response.status, message: response.statusText };
    }
    
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('audio')) {
      console.warn(`[WARN] Content-Type não é de áudio: ${contentType}`);
      return { valid: false, status: 200, message: `Content-Type inválido: ${contentType}` };
    }
    
    const contentLength = response.headers.get('content-length');
    if (!contentLength || parseInt(contentLength, 10) < 1000) {
      console.warn(`[WARN] Arquivo de áudio muito pequeno: ${contentLength} bytes`);
      return { valid: false, status: 200, message: `Tamanho de arquivo suspeito: ${contentLength} bytes` };
    }
    
    console.log(`[DEBUG] URL de áudio validada com sucesso! Content-Type: ${contentType}, Size: ${contentLength} bytes`);
    return { valid: true, contentType, contentLength };
  } catch (error) {
    console.error(`[ERROR] Erro ao validar URL de áudio: ${error}`);
    return { valid: false, status: 0, message: error.message };
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
            twilioPhoneNumberConfigured: Boolean(Deno.env.get("TWILIO_PHONE_NUMBER")),
            elevenLabsKeyConfigured: Boolean(Deno.env.get("ELEVENLABS_API_KEY"))
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
    const elevenLabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    
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
    console.log(`ElevenLabs API key configured: ${Boolean(elevenLabsApiKey)}`);

    // Get request data
    let { 
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
      transcribeCall = true,
      message  // Parâmetro de mensagem para ser utilizado no tts-twillio-handler
    } = requestBody;

    // NOTA: Removido o teste forçado de voz pois agora estamos usando Twilio Assets
    // voiceId = voiceId || "21m00Tcm4TlvDq8ikWAM"; // Voz Antônio (pt-BR)

    console.log("\n=== MAKE-CALL DEBUG DIAGNOSTICS ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Full requestBody: ${JSON.stringify(requestBody, null, 2)}`);
    console.log(`Phone number: ${phoneNumber}`);
    console.log(`Voice ID received: ${voiceId || "not specified"}`);
    console.log(`Message parameter: "${message || "not provided"}"`);
    console.log(`Message length: ${message ? message.length : 0} characters`);
    console.log(`TwiML instructions provided: ${twimlInstructions ? "YES" : "NO"}`);

    if (!phoneNumber) {
      throw new Error("Phone number is required");
    }

    // Verificação explícita da mensagem
    if (!message) {
      console.warn("Warning: No message parameter provided for the call. This may result in a generic audio being played.");
      throw new Error("Message parameter is required for the call. Please provide a text message for the agent to speak.");
    }

    console.log(`\nStarting call to ${phoneNumber}`);

    try {
      // Initialize Twilio client with improved error handling
      console.log("Starting Twilio client creation...");
      const client = await getTwilioClient(twilioAccountSid, twilioAuthToken);
      console.log("Twilio client created successfully");

      // Format the number to international format
      const formattedPhoneNumber = formatPhoneNumber(phoneNumber);
      console.log(`Formatted number: ${formattedPhoneNumber}`);
      
      // Base URL for functions and callbacks
      const baseUrl = Deno.env.get("SUPABASE_URL") || "";
      
      if (!baseUrl) {
        console.warn("Supabase URL not configured, callback links may not work properly");
      }
      
      // Create TwiML for the call
      let twiml = twimlInstructions;
      
      // Se não temos TwiML pré-definido, criamos um usando a API da Twilio
      if (!twiml) {
        // Criar um ID único para a chamada
        const callId = `call_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Se temos uma mensagem, prepara um TwiML com ela usando o handler TTS
        if (message) {
          // Usar o nosso handler TTS que agora faz upload para o Twilio Assets
          const encodedMessage = encodeURIComponent(message);
          const encodedVoiceId = encodeURIComponent(voiceId || "21m00Tcm4TlvDq8ikWAM"); // Antônio - voz default para português
          
          // Garantir que o texto está sendo passado corretamente
          if (encodedMessage.length === 0) {
            throw new Error("A mensagem de texto codificada está vazia. Verifique o parâmetro message");
          }
          
          // Adicionar um timestamp para prevenir cache
          const timestamp = Date.now();
          const ttsUrl = `${baseUrl}/functions/v1/tts-twillio-handler?text=${encodedMessage}&voiceId=${encodedVoiceId}&callSid=${callId}&_t=${timestamp}`;
          
          console.log(`\n[DEBUG] URL de TTS gerada: ${ttsUrl}`);
          
          // Construir TwiML com uso do nosso handler TTS que agora retorna URL do Twilio Assets
          // Simplificado para usar apenas a tag Play conforme requisitado
          twiml = `
            <Response>
              <Redirect method="GET">${ttsUrl}</Redirect>
            </Response>
          `;
        } else {
          // Mensagem padrão se nenhuma for fornecida - em português - simplificada para compatibilidade
          console.error("Erro crítico: nenhuma mensagem fornecida. Usando mensagem padrão");
          twiml = `
            <Response>
              <Say language="pt-BR">Olá, esta é uma chamada automatizada da Voxemy. Obrigado por atender.</Say>
            </Response>
          `;
        }
      }

      // Log the configured TwiML for debugging
      console.log(`\nTwiML final configurado: ${twiml}`);

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
          
        console.log(`\nCallback URL configurado: ${finalCallbackUrl}`);
      } else {
        console.log("\nNo callback URL provided");
      }

      // Get the Twilio phone number from environment variables
      console.log(`\nUsing Twilio number: ${twilioPhone}`);
      
      // Make the call with improved error handling
      try {
        console.log("\nCreating call via Twilio API...");
        
        // Adicionar parâmetros para melhorar compatibilidade
        const callParams = {
          twiml: twiml,
          to: formattedPhoneNumber,
          from: twilioPhone,
          statusCallback: callbackUrl || undefined,
          statusCallbackEvent: callbackUrl ? ['initiated', 'ringing', 'answered', 'completed'] : undefined,
          statusCallbackMethod: 'POST',
          record: recordCall,
          timeout: 30,  // Timeout em segundos (padrão é 60)
          machineDetection: 'DetectMessageEnd',  // Detectar se atendeu máquina
        };
        
        console.log(`\n[DEBUG] Parâmetros completos para chamada Twilio: ${JSON.stringify(callParams, null, 2)}`);
        
        const call = await client.calls.create(callParams);
        
        console.log("\nCall created successfully:", call.sid);
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
                
              console.log(`\nStatus of lead ${leadId} updated to 'called'`);
              
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
