
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EvolutionWebhookPayload {
  event: string;
  instance: string;
  data: {
    key?: {
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
    messageTimestamp?: number;
    pushName?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const agentId = url.pathname.split('/').pop();
    
    console.log('Webhook called for agent:', agentId);
    console.log('Request method:', req.method);
    
    if (!agentId) {
      console.error('No agent ID in webhook URL');
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
      const body: EvolutionWebhookPayload = await req.json();
      console.log('WhatsApp webhook received:', JSON.stringify(body, null, 2));

      // Handle different webhook events
      switch (body.event) {
        case 'CONNECTION_UPDATE':
          console.log('Processing CONNECTION_UPDATE event');
          // Update connection status in database
          const connectionStatus = body.data.key ? 'connected' : 'disconnected';
          await supabase
            .from('whatsapp_connections')
            .update({ 
              status: connectionStatus,
              last_connected_at: connectionStatus === 'connected' ? new Date().toISOString() : null
            })
            .eq('instance_id', body.instance);
          
          console.log('Connection status updated to:', connectionStatus);
          
          return new Response(JSON.stringify({ status: 'connection_updated' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case 'MESSAGES_UPSERT':
          console.log('Processing MESSAGES_UPSERT event');
          // Process incoming messages
          const messageData = body.data;
          
          if (!messageData.key || messageData.key.fromMe) {
            console.log('Ignoring message from bot itself');
            return new Response(JSON.stringify({ status: 'ignored' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const messageText = messageData.message?.conversation || 
                             messageData.message?.extendedTextMessage?.text || '';
          
          if (!messageText.trim()) {
            console.log('No text content in message');
            return new Response(JSON.stringify({ status: 'no_text' }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const fromNumber = messageData.key.remoteJid.replace('@s.whatsapp.net', '');
          const senderName = messageData.pushName || fromNumber;
          
          console.log('Processing message from:', fromNumber, 'Text:', messageText);
          
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

          // Get WhatsApp connection info
          const { data: connection } = await supabase
            .from('whatsapp_connections')
            .select('phone_number')
            .eq('agent_id', agentId)
            .single();

          // Log incoming message
          const { error: logError } = await supabase
            .from('whatsapp_messages')
            .insert({
              agent_id: agentId,
              whatsapp_message_id: messageData.key.id,
              from_number: fromNumber,
              to_number: connection?.phone_number || '',
              message_text: messageText,
              message_type: 'text',
              direction: 'inbound',
              status: 'received'
            });

          if (logError) {
            console.error('Failed to log message:', logError);
          }

          // Build system prompt for AI
          const systemPrompt = `Você é ${agent.name}, um assistente de WhatsApp.

Descrição: ${agent.description || ''}
Instruções: ${agent.instructions || ''}
Estilo de resposta: ${agent.response_style || ''}
Conhecimento: ${agent.knowledge || ''}

IMPORTANTE:
- Responda em português brasileiro
- Seja natural e conversacional
- Mantenha as respostas concisas (máximo 200 caracteres)
- Use o nome do cliente quando apropriado: ${senderName}
- Esta é uma conversa por WhatsApp, seja direto e amigável`;

          console.log('Processing with AI...');

          // Process with AI
          const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-conversation', {
            body: {
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: messageText }
              ],
              model: agent.ai_model || 'gpt-4o-mini'
            }
          });

          let responseText = agent.default_greeting || 'Olá! Como posso ajudá-lo hoje?';

          if (aiError) {
            console.error('AI processing error:', aiError);
          } else if (aiResponse?.response) {
            responseText = aiResponse.response;
          }
          
          // Limit response length for WhatsApp
          const maxLength = agent.max_response_length || 200;
          if (responseText.length > maxLength) {
            responseText = responseText.substring(0, maxLength - 3) + '...';
          }

          console.log('Sending response:', responseText);

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
          } else {
            console.log('Response sent successfully');
          }

          return new Response(JSON.stringify({ 
            status: 'processed',
            response: responseText 
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case 'QRCODE_UPDATED':
          console.log('Processing QRCODE_UPDATED event');
          // Update QR code in database
          if (body.data.key) {
            await supabase
              .from('whatsapp_connections')
              .update({ qr_code: body.data.key })
              .eq('instance_id', body.instance);
            
            console.log('QR code updated in database');
          }
          
          return new Response(JSON.stringify({ status: 'qr_updated' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        default:
          console.log('Unhandled webhook event:', body.event);
          return new Response(JSON.stringify({ status: 'ignored' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
      }
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
