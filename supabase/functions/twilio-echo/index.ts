
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
  
  console.log("Twilio Echo webhook invoked");
  
  try {
    // For debugging: log all received headers
    console.log("Request headers:", Object.fromEntries(req.headers));

    // Parse form data from Twilio (which sends as application/x-www-form-urlencoded)
    let twilioData;
    
    if (req.headers.get("content-type")?.includes("application/x-www-form-urlencoded")) {
      const formData = await req.formData();
      twilioData = Object.fromEntries(formData);
    } else if (req.headers.get("content-type")?.includes("application/json")) {
      twilioData = await req.json();
    } else {
      // If we can't parse the data, log what we received
      const bodyText = await req.text();
      console.log("Received unparseable body:", bodyText.substring(0, 1000));
      twilioData = { unparsed: true };
    }
    
    console.log("Received Twilio data:", twilioData);
    
    // Extract the speech result or provide a default message
    const speechResult = twilioData.SpeechResult || "Não entendi o que você disse";
    
    console.log(`Speech result: "${speechResult}"`);
    
    // Create a simple TwiML response
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Camila" language="pt-BR">Você disse: ${speechResult}</Say>
  <Pause length="1"/>
  <Say voice="Polly.Camila" language="pt-BR">Teste de eco concluído com sucesso!</Say>
  <Hangup/>
</Response>`;

    console.log("Sending TwiML response:", twiml);
    
    return new Response(twiml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/xml",
        "Cache-Control": "no-cache"
      }
    });
  } catch (error) {
    console.error("Error in Twilio Echo webhook:", error);
    
    // Return a simple error TwiML
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Camila" language="pt-BR">Ocorreu um erro no processamento. Por favor, tente novamente.</Say>
  <Hangup/>
</Response>`;
    
    return new Response(errorTwiml, {
      headers: { ...corsHeaders, "Content-Type": "text/xml" }
    });
  }
});
