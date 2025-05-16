
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
    const { phoneNumber, twimlBinId, description } = await req.json();
    
    if (!phoneNumber) {
      return new Response(JSON.stringify({ 
        error: 'Phone number is required' 
      }), { 
        status: 400, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    if (!twimlBinId) {
      return new Response(JSON.stringify({ 
        error: 'TwiML Bin ID is required' 
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

    console.log(`Making manual test call to ${formattedPhone} with TwiML Bin ID: ${twimlBinId}`);

    // Initialize Twilio client
    const client = twilio(
      Deno.env.get("TWILIO_ACCOUNT_SID") || '',
      Deno.env.get("TWILIO_AUTH_TOKEN") || '',
    );

    if (!Deno.env.get("TWILIO_ACCOUNT_SID") || !Deno.env.get("TWILIO_AUTH_TOKEN") || !Deno.env.get("TWILIO_PHONE_NUMBER")) {
      throw new Error("Missing Twilio credentials. Please check environment variables.");
    }

    // Generate URL for the TwiML Bin
    const twimlUrl = `https://handler.twilio.com/twiml/${twimlBinId}`;
    
    // Make the call
    const call = await client.calls.create({
      to: formattedPhone,
      from: Deno.env.get("TWILIO_PHONE_NUMBER") || '',
      url: twimlUrl,
      statusCallback: `${Deno.env.get("SUPABASE_URL")}/functions/v1/call-status`,
      statusCallbackEvent: ["completed", "answered", "busy", "no-answer", "failed"],
      statusCallbackMethod: "POST",
    });

    console.log("Manual call initiated successfully:", call.sid);

    // Return success response with call details
    return new Response(
      JSON.stringify({ 
        success: true, 
        callSid: call.sid,
        testDescription: description || 'Manual TwiML Bin test',
        status: call.status,
        twimlUrl
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error("Error making manual test call:", error);
    
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
