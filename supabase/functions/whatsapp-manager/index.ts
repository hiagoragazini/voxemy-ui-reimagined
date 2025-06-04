
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
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const url = new URL(req.url);
    const agentId = url.pathname.split('/')[2]; // /whatsapp-manager/agentId/action
    const action = url.pathname.split('/')[3];

    if (!agentId) {
      return new Response(JSON.stringify({ error: 'Agent ID is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const evolutionApiUrl = Deno.env.get('EVOLUTION_API_URL');
    const evolutionApiKey = Deno.env.get('EVOLUTION_API_KEY');

    if (!evolutionApiUrl || !evolutionApiKey) {
      return new Response(JSON.stringify({ error: 'Evolution API not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    switch (action) {
      case 'connect':
        if (req.method === 'POST') {
          const instanceName = `agent_${agentId}`;
          
          // Create Evolution API instance
          const createResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey
            },
            body: JSON.stringify({
              instanceName: instanceName,
              token: evolutionApiKey,
              qrcode: true,
              webhook: `https://nklbbeavnbwvvatqimxw.supabase.co/functions/v1/whatsapp-webhook/${agentId}`,
              webhookByEvents: false,
              webhookBase64: false,
              events: ['APPLICATION_STARTUP', 'QRCODE_UPDATED', 'CONNECTION_UPDATE', 'MESSAGES_UPSERT']
            })
          });

          const createResult = await createResponse.json();
          
          if (!createResponse.ok) {
            throw new Error(`Failed to create instance: ${createResult.message}`);
          }

          // Update or create connection record
          const { error: upsertError } = await supabase
            .from('whatsapp_connections')
            .upsert({
              agent_id: agentId,
              instance_id: instanceName,
              status: 'connecting'
            }, {
              onConflict: 'agent_id'
            });

          if (upsertError) {
            console.error('Database error:', upsertError);
          }

          return new Response(JSON.stringify({
            status: 'connecting',
            instanceId: instanceName,
            qrCode: createResult.qrcode?.base64
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        break;

      case 'disconnect':
        if (req.method === 'POST') {
          const { data: connection } = await supabase
            .from('whatsapp_connections')
            .select('instance_id')
            .eq('agent_id', agentId)
            .single();

          if (connection?.instance_id) {
            await fetch(`${evolutionApiUrl}/instance/delete/${connection.instance_id}`, {
              method: 'DELETE',
              headers: {
                'apikey': evolutionApiKey
              }
            });
          }

          await supabase
            .from('whatsapp_connections')
            .update({ status: 'disconnected' })
            .eq('agent_id', agentId);

          return new Response(JSON.stringify({ status: 'disconnected' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        break;

      case 'status':
        if (req.method === 'GET') {
          const { data: connection } = await supabase
            .from('whatsapp_connections')
            .select('*')
            .eq('agent_id', agentId)
            .single();

          if (!connection) {
            return new Response(JSON.stringify({ 
              status: 'disconnected',
              connected: false 
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Check actual status from Evolution API
          if (connection.instance_id) {
            try {
              const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${connection.instance_id}`, {
                headers: {
                  'apikey': evolutionApiKey
                }
              });
              
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                const isConnected = statusData.instance?.state === 'open';
                
                // Update database if status changed
                if ((isConnected && connection.status !== 'connected') || 
                    (!isConnected && connection.status === 'connected')) {
                  await supabase
                    .from('whatsapp_connections')
                    .update({ 
                      status: isConnected ? 'connected' : 'disconnected',
                      last_connected_at: isConnected ? new Date().toISOString() : connection.last_connected_at
                    })
                    .eq('agent_id', agentId);
                }

                return new Response(JSON.stringify({
                  ...connection,
                  status: isConnected ? 'connected' : 'disconnected',
                  connected: isConnected
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
              }
            } catch (error) {
              console.error('Error checking Evolution API status:', error);
            }
          }

          return new Response(JSON.stringify({
            ...connection,
            connected: connection.status === 'connected'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        break;

      case 'qrcode':
        if (req.method === 'GET') {
          const { data: connection } = await supabase
            .from('whatsapp_connections')
            .select('instance_id')
            .eq('agent_id', agentId)
            .single();

          if (connection?.instance_id) {
            try {
              const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${connection.instance_id}`, {
                headers: {
                  'apikey': evolutionApiKey
                }
              });

              if (qrResponse.ok) {
                const qrData = await qrResponse.json();
                return new Response(JSON.stringify({
                  qrCode: qrData.base64
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
              }
            } catch (error) {
              console.error('Error getting QR code:', error);
            }
          }

          return new Response(JSON.stringify({ error: 'QR code not available' }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
        break;
    }

    return new Response(JSON.stringify({ error: 'Invalid action or method' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('WhatsApp manager error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
