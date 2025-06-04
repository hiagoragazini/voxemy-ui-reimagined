
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppMessage {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  message?: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
  };
  messageTimestamp: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.pathname.split('/').pop();
    
    if (!agentId) {
      return new Response(JSON.stringify({ error: 'Agent ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const body = await req.json();
      console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));

      // Extract message from webhook payload
      const message: WhatsAppMessage = body.data;
      
      if (!message || message.key.fromMe) {
        // Ignore messages sent by the bot itself
        return new Response(JSON.stringify({ status: 'ignored' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const messageText = message.message?.conversation || 
                         message.message?.extendedTextMessage?.text || '';
      
      if (!messageText.trim()) {
        return new Response(JSON.stringify({ status: 'no_text' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const fromNumber = message.key.remoteJid.replace('@s.whatsapp.net', '');
      
      // Get agent configuration
      const { data: agent, error: agentError } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();

      if (agentError || !agent) {
        console.error('Agent not found:', agentError);
        return new Response(JSON.stringify({ error: 'Agent not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Log incoming message
      await supabase
        .from('whatsapp_messages')
        .insert({
          agent_id: agentId,
          whatsapp_message_id: message.key.id,
          from_number: fromNumber,
          to_number: agent.phone_number || '',
          message_text: messageText,
          direction: 'inbound',
          status: 'received'
        });

      // Process with AI
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-conversation', {
        body: {
          message: messageText,
          agentId: agentId,
          context: {
            platform: 'whatsapp',
            fromNumber: fromNumber
          }
        }
      });

      if (aiError) {
        console.error('AI processing error:', aiError);
        return new Response(JSON.stringify({ error: 'AI processing failed' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const responseText = aiResponse?.response || 'Desculpe, não consegui processar sua mensagem.';

      // Send response back to WhatsApp
      const { error: sendError } = await supabase.functions.invoke('whatsapp-sender', {
        body: {
          agentId: agentId,
          to: fromNumber,
          message: responseText
        }
      });

      if (sendError) {
        console.error('Failed to send WhatsApp message:', sendError);
      }

      return new Response(JSON.stringify({ 
        status: 'processed',
        response: responseText 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
