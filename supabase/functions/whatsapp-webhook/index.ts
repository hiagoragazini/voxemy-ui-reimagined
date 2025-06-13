
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
    qrcode?: string;
    state?: string;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('WhatsApp webhook received:', req.method, req.url);
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'POST') {
      const body: EvolutionWebhookPayload = await req.json();
      console.log('Webhook payload:', JSON.stringify(body, null, 2));

      // Get agent by instance
      const { data: connection } = await supabase
        .from('whatsapp_connections')
        .select('agent_id')
        .eq('instance_id', body.instance)
        .single();

      if (!connection) {
        console.error('No agent found for instance:', body.instance);
        return new Response(JSON.stringify({ error: 'Agent not found' }), {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      const agentId = connection.agent_id;

      // Process different events
      switch (body.event) {
        case 'qrcode.updated':
        case 'QRCODE_UPDATED':
          console.log('Processing QR code update');
          const qrCode = body.data.qrcode;
          
          if (qrCode) {
            await supabase
              .from('whatsapp_connections')
              .update({ 
                qr_code: qrCode,
                status: 'connecting',
                updated_at: new Date().toISOString()
              })
              .eq('instance_id', body.instance);
            
            console.log('QR code updated in database');
          }
          
          return new Response(JSON.stringify({ status: 'qr_updated' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case 'connection.update':
        case 'CONNECTION_UPDATE':
          console.log('Processing connection update');
          const state = body.data.state;
          const status = state === 'open' ? 'connected' : 'disconnected';
          
          await supabase
            .from('whatsapp_connections')
            .update({ 
              status: status,
              last_connected_at: status === 'connected' ? new Date().toISOString() : null,
              qr_code: status === 'connected' ? null : undefined,
              updated_at: new Date().toISOString()
            })
            .eq('instance_id', body.instance);
          
          console.log('Connection status updated to:', status);
          
          return new Response(JSON.stringify({ status: 'connection_updated' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        case 'messages.upsert':
        case 'MESSAGES_UPSERT':
          console.log('Processing new message');
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

          // Save incoming message
          await supabase
            .from('whatsapp_messages')
            .insert({
              agent_id: agentId,
              whatsapp_message_id: messageData.key.id,
              from_number: fromNumber,
              to_number: '',
              message_text: messageText,
              message_type: 'text',
              direction: 'inbound',
              status: 'received'
            });

          // Get recent conversation context
          const { data: recentMessages } = await supabase
            .from('whatsapp_messages')
            .select('message_text, direction')
            .eq('agent_id', agentId)
            .eq('from_number', fromNumber)
            .order('created_at', { ascending: false })
            .limit(10);

          const conversationHistory = recentMessages?.reverse().map(msg => 
            msg.direction === 'inbound' 
              ? `${senderName}: ${msg.message_text}` 
              : `${agent.name}: ${msg.message_text}`
          ).join('\n') || '';

          // Build system prompt for AI
          const systemPrompt = `Você é ${agent.name}, um assistente de WhatsApp.

${agent.description ? `Descrição: ${agent.description}` : ''}
${agent.instructions ? `Instruções: ${agent.instructions}` : ''}
${agent.response_style ? `Estilo de resposta: ${agent.response_style}` : ''}
${agent.knowledge ? `Conhecimento: ${agent.knowledge}` : ''}

IMPORTANTE:
- Responda em português brasileiro
- Seja natural e conversacional
- Mantenha as respostas concisas (máximo ${agent.max_response_length || 200} caracteres)
- Use o nome do cliente quando apropriado: ${senderName}
- Esta é uma conversa por WhatsApp, seja direto e amigável

Contexto da conversa recente:
${conversationHistory}`;

          console.log('Processing with AI...');

          // Process with OpenAI
          const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
          
          let responseText = agent.default_greeting || 'Olá! Como posso ajudá-lo hoje?';

          if (openAIApiKey) {
            try {
              const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${openAIApiKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  model: agent.ai_model || 'gpt-4o-mini',
                  messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: messageText }
                  ],
                  max_tokens: 150,
                  temperature: 0.7,
                }),
              });

              if (aiResponse.ok) {
                const aiData = await aiResponse.json();
                responseText = aiData.choices[0]?.message?.content?.trim() || responseText;
              } else {
                console.error('OpenAI API error:', await aiResponse.text());
              }
            } catch (aiError) {
              console.error('AI processing error:', aiError);
            }
          } else {
            console.warn('OpenAI API key not configured, using default greeting');
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
            
            // Save outgoing message
            await supabase
              .from('whatsapp_messages')
              .insert({
                agent_id: agentId,
                whatsapp_message_id: `out_${Date.now()}`,
                from_number: '',
                to_number: fromNumber,
                message_text: responseText,
                message_type: 'text',
                direction: 'outbound',
                status: 'sent'
              });
          }

          return new Response(JSON.stringify({ 
            status: 'processed',
            response: responseText 
          }), {
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
