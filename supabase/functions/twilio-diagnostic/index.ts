
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Async function to import Twilio in a Deno-compatible way
async function getTwilioClient(accountSid: string, authToken: string) {
  const twilio = await import("npm:twilio@4.20.0");
  return new twilio.default(accountSid, authToken);
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { phoneNumber, mode, twiml: customTwiml } = requestData;

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ error: "Phone number is required" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }
    
    console.log(`Starting diagnostic call to ${phoneNumber} (mode: ${mode})`);

    // Get Twilio credentials from environment variables
    const twilioAccountSid = Deno.env.get("TWILIO_ACCOUNT_SID");
    const twilioAuthToken = Deno.env.get("TWILIO_AUTH_TOKEN");
    const twilioPhoneNumber = Deno.env.get("TWILIO_PHONE_NUMBER");
    
    if (!twilioAccountSid || !twilioAuthToken || !twilioPhoneNumber) {
      console.error("Missing Twilio credentials");
      return new Response(
        JSON.stringify({ error: "Twilio credentials not configured" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    // Format the phone number to international format
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('+')) {
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = `55${formattedPhone}`;
      }
      formattedPhone = `+${formattedPhone}`;
    }
    
    console.log(`Formatted phone number: ${formattedPhone}`);

    // Initialize the Twilio client
    const twilioClient = await getTwilioClient(twilioAccountSid, twilioAuthToken);
    
    // Determine the TwiML based on the mode
    let twiml;
    
    if (mode === 'custom' && customTwiml) {
      // Use custom TwiML provided by the user
      twiml = customTwiml;
    } else {
      // Use basic diagnostic TwiML
      twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Camila" language="pt-BR">Esta é uma mensagem de teste do diagnosticador Voxemy. Por favor, diga algo após o bipe.</Say>
  <Gather input="speech" language="pt-BR" action="https://${req.headers.get('host')}/functions/v1/twilio-echo" method="POST" timeout="5">
    <Say voice="Polly.Camila" language="pt-BR">Por favor, fale agora.</Say>
  </Gather>
  <Say voice="Polly.Camila" language="pt-BR">Não ouvi nada. Vou encerrar a chamada.</Say>
  <Hangup/>
</Response>`;
    }
    
    console.log("Using TwiML:", twiml);
    
    // Make the call using Twilio
    const call = await twilioClient.calls.create({
      twiml: twiml,
      to: formattedPhone,
      from: twilioPhoneNumber,
      statusCallback: `https://${req.headers.get('host')}/functions/v1/call-status`,
      statusCallbackMethod: 'POST',
      statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed']
    });
    
    console.log(`Call initiated, SID: ${call.sid}`);
    
    // Return success response
    return new Response(
      JSON.stringify({
        success: true,
        call_sid: call.sid,
        status: call.status,
        phone_number: formattedPhone,
        mode: mode,
        message: "Diagnostic call initiated"
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in Twilio diagnostic function:", error);
    
    // Return error response
    return new Response(
      JSON.stringify({
        error: true,
        message: error.message || "Unknown error",
        stack: error.stack
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
