
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
    console.log('WhatsApp Manager called with method:', req.method);
    
    if (req.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const requestBody = await req.text();
    console.log('Raw request body:', requestBody);

    let body;
    try {
      body = JSON.parse(requestBody);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      return new Response(JSON.stringify({ error: 'Invalid JSON in request body' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const { action, agentId } = body;
    console.log('Parsed request:', { action, agentId });

    if (!agentId) {
      console.error('Missing agentId in request');
      return new Response(JSON.stringify({ error: 'Agent ID is required' }), {
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

    console.log('Evolution API URL:', evolutionApiUrl);
    console.log('Evolution API Key exists:', !!evolutionApiKey);

    if (!evolutionApiUrl || !evolutionApiKey) {
      console.error('Evolution API not configured');
      return new Response(JSON.stringify({ 
        error: 'Evolution API not configured. Please add EVOLUTION_API_URL and EVOLUTION_API_KEY to Supabase secrets.',
        configured: false
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const instanceName = `agent_${agentId}`;
    const webhookUrl = `${Deno.env.get('SUPABASE_URL')}/functions/v1/whatsapp-webhook/${agentId}`;
    console.log('Using instance name:', instanceName);
    console.log('Webhook URL:', webhookUrl);

    switch (action) {
      case 'connect':
        try {
          console.log('Starting connect process for agent:', agentId);
          
          // First try to delete existing instance (cleanup)
          try {
            console.log('Deleting existing instance...');
            const deleteResponse = await fetch(`${evolutionApiUrl}/instance/delete/${instanceName}`, {
              method: 'DELETE',
              headers: {
                'apikey': evolutionApiKey
              }
            });
            console.log('Delete existing instance response:', deleteResponse.status);
          } catch (deleteError) {
            console.log('No existing instance to delete or delete failed:', deleteError.message);
          }

          // Wait a moment before creating new instance
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Create new instance
          console.log('Creating new Evolution API instance...');
          const createPayload = {
            instanceName: instanceName,
            token: evolutionApiKey,
            qrcode: true,
            webhook: webhookUrl,
            webhookByEvents: false,
            webhookBase64: false,
            events: ['APPLICATION_STARTUP', 'QRCODE_UPDATED', 'CONNECTION_UPDATE', 'MESSAGES_UPSERT']
          };
          
          console.log('Create payload:', JSON.stringify(createPayload, null, 2));

          const createResponse = await fetch(`${evolutionApiUrl}/instance/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'apikey': evolutionApiKey
            },
            body: JSON.stringify(createPayload)
          });

          const createResponseText = await createResponse.text();
          console.log('Create response status:', createResponse.status);
          console.log('Create response body:', createResponseText);

          if (!createResponse.ok) {
            throw new Error(`Failed to create instance: ${createResponse.status} - ${createResponseText}`);
          }

          // Wait for instance to initialize
          console.log('Waiting for instance to initialize...');
          await new Promise(resolve => setTimeout(resolve, 3000));

          // Get QR code
          console.log('Fetching QR code...');
          const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${instanceName}`, {
            method: 'GET',
            headers: {
              'apikey': evolutionApiKey
            }
          });

          console.log('QR response status:', qrResponse.status);
          
          let qrCode = null;
          if (qrResponse.ok) {
            const qrResponseText = await qrResponse.text();
            console.log('QR response body:', qrResponseText.substring(0, 200) + '...');
            
            try {
              const qrData = JSON.parse(qrResponseText);
              qrCode = qrData.base64 || qrData.qrcode?.base64 || qrData.qr;
              console.log('QR code extracted, length:', qrCode ? qrCode.length : 0);
            } catch (qrParseError) {
              console.error('Failed to parse QR response:', qrParseError);
            }
          } else {
            const qrErrorText = await qrResponse.text();
            console.error('QR request failed:', qrResponse.status, qrErrorText);
          }

          // Update database
          console.log('Updating database...');
          const { error: upsertError } = await supabase
            .from('whatsapp_connections')
            .upsert({
              agent_id: agentId,
              instance_id: instanceName,
              status: qrCode ? 'connecting' : 'error',
              qr_code: qrCode,
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'agent_id'
            });

          if (upsertError) {
            console.error('Database upsert error:', upsertError);
            throw new Error(`Database error: ${upsertError.message}`);
          }

          console.log('Database updated successfully');

          return new Response(JSON.stringify({
            status: qrCode ? 'connecting' : 'error',
            instanceId: instanceName,
            qrCode: qrCode,
            message: qrCode ? 'QR Code generated successfully' : 'Failed to generate QR Code'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('Connect error:', error);
          
          // Update database with error status
          await supabase
            .from('whatsapp_connections')
            .upsert({
              agent_id: agentId,
              instance_id: instanceName,
              status: 'error',
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'agent_id'
            });

          return new Response(JSON.stringify({ 
            error: error.message,
            status: 'error',
            details: 'Failed to connect WhatsApp. Check Evolution API configuration and logs.'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'disconnect':
        try {
          console.log('Starting disconnect process for agent:', agentId);
          
          const { data: connection } = await supabase
            .from('whatsapp_connections')
            .select('instance_id')
            .eq('agent_id', agentId)
            .single();

          console.log('Found connection:', connection);

          if (connection?.instance_id) {
            try {
              const deleteResponse = await fetch(`${evolutionApiUrl}/instance/delete/${connection.instance_id}`, {
                method: 'DELETE',
                headers: {
                  'apikey': evolutionApiKey
                }
              });
              
              console.log('Delete response status:', deleteResponse.status);
              
              if (!deleteResponse.ok) {
                const deleteErrorText = await deleteResponse.text();
                console.error('Failed to delete instance:', deleteErrorText);
              }
            } catch (deleteError) {
              console.error('Error deleting instance:', deleteError.message);
            }
          }

          const { error: updateError } = await supabase
            .from('whatsapp_connections')
            .update({ 
              status: 'disconnected',
              qr_code: null,
              phone_number: null,
              updated_at: new Date().toISOString()
            })
            .eq('agent_id', agentId);

          if (updateError) {
            console.error('Database update error:', updateError);
            throw new Error(`Database error: ${updateError.message}`);
          }

          console.log('Disconnect completed successfully');

          return new Response(JSON.stringify({ 
            status: 'disconnected',
            message: 'WhatsApp disconnected successfully'
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('Disconnect error:', error);
          return new Response(JSON.stringify({ 
            error: error.message,
            details: 'Failed to disconnect WhatsApp'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'status':
        try {
          console.log('Checking status for agent:', agentId);
          
          const { data: connection } = await supabase
            .from('whatsapp_connections')
            .select('*')
            .eq('agent_id', agentId)
            .single();

          console.log('Database connection:', connection);

          if (!connection) {
            console.log('No connection found in database');
            return new Response(JSON.stringify({ 
              status: 'disconnected',
              connected: false,
              message: 'No WhatsApp connection found'
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          // Check real status from Evolution API if we have an instance
          if (connection.instance_id && evolutionApiUrl && evolutionApiKey) {
            try {
              console.log('Checking Evolution API status for instance:', connection.instance_id);
              
              const statusResponse = await fetch(`${evolutionApiUrl}/instance/connectionState/${connection.instance_id}`, {
                headers: {
                  'apikey': evolutionApiKey
                }
              });
              
              console.log('Status response status:', statusResponse.status);
              
              if (statusResponse.ok) {
                const statusResponseText = await statusResponse.text();
                console.log('Status response body:', statusResponseText);
                
                try {
                  const statusData = JSON.parse(statusResponseText);
                  const isConnected = statusData.instance?.state === 'open';
                  console.log('Connection state from API:', statusData.instance?.state);
                  
                  let phoneNumber = connection.phone_number;
                  if (isConnected && statusData.instance?.owner) {
                    phoneNumber = statusData.instance.owner;
                  }

                  // Update database if status changed
                  const newStatus = isConnected ? 'connected' : 'disconnected';
                  if (connection.status !== newStatus || phoneNumber !== connection.phone_number) {
                    console.log('Updating connection status in database');
                    await supabase
                      .from('whatsapp_connections')
                      .update({ 
                        status: newStatus,
                        phone_number: phoneNumber,
                        last_connected_at: isConnected ? new Date().toISOString() : connection.last_connected_at,
                        qr_code: isConnected ? null : connection.qr_code,
                        updated_at: new Date().toISOString()
                      })
                      .eq('agent_id', agentId);
                  }

                  return new Response(JSON.stringify({
                    ...connection,
                    status: newStatus,
                    phone_number: phoneNumber,
                    connected: isConnected,
                    message: isConnected ? 'WhatsApp connected' : 'WhatsApp disconnected'
                  }), {
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                  });
                } catch (statusParseError) {
                  console.error('Failed to parse status response:', statusParseError);
                }
              } else {
                const statusErrorText = await statusResponse.text();
                console.error('Status check failed:', statusResponse.status, statusErrorText);
              }
            } catch (statusError) {
              console.error('Error checking Evolution API status:', statusError);
            }
          }

          return new Response(JSON.stringify({
            ...connection,
            connected: connection.status === 'connected',
            message: `Status: ${connection.status}`
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('Status error:', error);
          return new Response(JSON.stringify({ 
            error: error.message,
            details: 'Failed to check WhatsApp status'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      case 'qrcode':
        try {
          console.log('Refreshing QR code for agent:', agentId);
          
          const { data: connection } = await supabase
            .from('whatsapp_connections')
            .select('instance_id')
            .eq('agent_id', agentId)
            .single();

          if (!connection?.instance_id) {
            return new Response(JSON.stringify({ 
              error: 'No active instance found',
              message: 'Connect WhatsApp first'
            }), {
              status: 404,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
          }

          const qrResponse = await fetch(`${evolutionApiUrl}/instance/connect/${connection.instance_id}`, {
            headers: {
              'apikey': evolutionApiKey
            }
          });

          console.log('QR refresh response status:', qrResponse.status);

          if (qrResponse.ok) {
            const qrResponseText = await qrResponse.text();
            console.log('QR refresh response body length:', qrResponseText.length);
            
            try {
              const qrData = JSON.parse(qrResponseText);
              const qrCode = qrData.base64 || qrData.qrcode?.base64 || qrData.qr;
              
              if (qrCode) {
                // Update QR code in database
                await supabase
                  .from('whatsapp_connections')
                  .update({ 
                    qr_code: qrCode,
                    updated_at: new Date().toISOString()
                  })
                  .eq('agent_id', agentId);

                console.log('QR code updated successfully');

                return new Response(JSON.stringify({
                  qrCode: qrCode,
                  message: 'QR code refreshed successfully'
                }), {
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
                });
              }
            } catch (qrParseError) {
              console.error('Failed to parse QR refresh response:', qrParseError);
            }
          } else {
            const qrErrorText = await qrResponse.text();
            console.error('QR refresh failed:', qrResponse.status, qrErrorText);
          }

          return new Response(JSON.stringify({ 
            error: 'QR code not available',
            message: 'Unable to generate QR code. Try connecting again.'
          }), {
            status: 404,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });

        } catch (error) {
          console.error('QR code error:', error);
          return new Response(JSON.stringify({ 
            error: error.message,
            details: 'Failed to refresh QR code'
          }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }

      default:
        console.error('Invalid action:', action);
        return new Response(JSON.stringify({ 
          error: 'Invalid action',
          validActions: ['connect', 'disconnect', 'status', 'qrcode']
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
    }

  } catch (error) {
    console.error('WhatsApp manager error:', error);
    return new Response(JSON.stringify({ 
      error: error.message,
      details: 'Unexpected error in WhatsApp manager'
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
