
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import twilio from "npm:twilio";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    const { phoneNumber, audioUrl, description } = await req.json();
    
    if (!phoneNumber) {
      return new Response(JSON.stringify({ 
        error: 'Phone number is required' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (!audioUrl) {
      return new Response(JSON.stringify({ 
        error: 'Audio URL is required' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    // Format the phone number to E.164 format with default BR country code if not provided
    let formattedPhone = phoneNumber;
    if (!phoneNumber.startsWith('+')) {
      // Add Brazil country code by default if not already included
      formattedPhone = `+55${phoneNumber}`;
    }

    console.log(`Making test call to ${formattedPhone} with audio URL: ${audioUrl}`);

    // Initialize Twilio client
    const client = twilio(
      Deno.env.get("TWILIO_ACCOUNT_SID") || '',
      Deno.env.get("TWILIO_AUTH_TOKEN") || '',
    );

    if (!Deno.env.get("TWILIO_ACCOUNT_SID") || !Deno.env.get("TWILIO_AUTH_TOKEN") || !Deno.env.get("TWILIO_PHONE_NUMBER")) {
      throw new Error("Missing Twilio credentials. Please check environment variables.");
    }

    // Create simple TwiML to play the audio file
    const twiml = `
      <Response>
        <Play>${audioUrl}</Play>
      </Response>
    `;

    // Make the call
    const call = await client.calls.create({
      to: formattedPhone,
      from: Deno.env.get("TWILIO_PHONE_NUMBER") || '',
      twiml: twiml,
      statusCallback: `${Deno.env.get("SUPABASE_URL")}/functions/v1/call-status`,
      statusCallbackEvent: ["completed", "answered", "busy", "no-answer", "failed"],
      statusCallbackMethod: "POST",
    });

    console.log("Call initiated successfully:", call.sid);

    // Return success response with call details
    return new Response(
      JSON.stringify({ 
        success: true, 
        callSid: call.sid,
        testDescription: description || 'Simple MP3 audio test',
        status: call.status
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error making test call:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Unknown error occurred" 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
