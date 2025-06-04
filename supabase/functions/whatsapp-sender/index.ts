
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
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { agentId, to, message, messageType = 'text' } = await req.json();

    if (!agentId || !to || !message) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(JSON.stringify({ error: 'Evolution API not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get connection info
    const { data: connection } = await supabase
      .from('whatsapp_connections')
      .select('instance_id, phone_number')
      .eq('agent_id', agentId)
      .single();

    if (!connection?.instance_id) {
      return new Response(JSON.stringify({ error: 'WhatsApp not connected for this agent' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Send message via Evolution API
    const sendResponse = await fetch(`${evolutionApiUrl}/message/sendText/${connection.instance_id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': evolutionApiKey
      },
      body: JSON.stringify({
        number: `${to}@s.whatsapp.net`,
        text: message
      })
    });

    const sendResult = await sendResponse.json();

    if (!sendResponse.ok) {
      throw new Error(`Failed to send message: ${sendResult.message}`);
    }

    // Log outgoing message
    const { error: logError } = await supabase
      .from('whatsapp_messages')
      .insert({
        agent_id: agentId,
        whatsapp_message_id: sendResult.key?.id || '',
        from_number: connection.phone_number || '',
        to_number: to,
        message_text: message,
        message_type: messageType,
        direction: 'outbound',
        status: 'sent'
      });

    if (logError) {
      console.error('Failed to log message:', logError);
    }

    return new Response(JSON.stringify({
      status: 'sent',
      messageId: sendResult.key?.id,
      message: message
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('WhatsApp sender error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
