
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('WhatsApp Sender called');
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { agentId, to, message } = await req.json();

    if (!agentId || !to || !message) {
      return new Response(JSON.stringify({ error: 'Missing required parameters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Sending message to:', to, 'via agent:', agentId);

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get WhatsApp connection for this agent
    const { data: connection, error: connectionError } = await supabase
      .from('whatsapp_connections')
      .select('*')
      .eq('agent_id', agentId)
      .single();

    if (connectionError || !connection) {
      console.error('WhatsApp connection not found for agent:', agentId);
      return new Response(JSON.stringify({ error: 'WhatsApp not connected for this agent' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    if (connection.status !== 'connected') {
      console.error('WhatsApp not connected for agent:', agentId, 'Status:', connection.status);
      return new Response(JSON.stringify({ error: 'WhatsApp not connected' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('Evolution API not configured');
      return new Response(JSON.stringify({ error: 'Evolution API not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send message via Evolution API
    const sendPayload = {
      number: `${to}@s.whatsapp.net`,
      text: message
    };

    console.log('Sending message payload:', sendPayload);

    const sendResponse = await fetch(`${evolutionApiUrl}/message/sendText/${connection.instance_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify(sendPayload)
    });

    const sendResponseText = await sendResponse.text();
    console.log('Send response status:', sendResponse.status);
    console.log('Send response body:', sendResponseText);

    if (!sendResponse.ok) {
      throw new Error(`Failed to send message: ${sendResponse.status} - ${sendResponseText}`);
    }

    return new Response(JSON.stringify({ 
      success: true,
      message: 'Message sent successfully',
      messageId: `out_${Date.now()}`
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('WhatsApp Sender error:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Failed to send message',
      details: 'Check Evolution API configuration and connection status'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
