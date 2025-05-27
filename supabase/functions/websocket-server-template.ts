
// NOTE: This file is a template for deploying to Deno Deploy.
// It is not intended to be deployed as a Supabase Edge Function.
// Deploy this to Deno Deploy separately.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

// Setup simple WebSocket server for Twilio Media Streams
const sockets = new Map();
let connectionCounter = 0;

// Supabase configuration (optional, for logging)
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Save conversation to Supabase (optional)
async function saveConversationLog(callSid: string, event: string, data: any) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn("Supabase credentials missing, cannot save conversation log");
    return;
  }

  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/call_logs`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
        "Prefer": "return=minimal"
      },
      body: JSON.stringify({
        conversation_log: JSON.stringify({ event, data, timestamp: new Date().toISOString() })
      })
    });

    if (!response.ok) {
      console.error(`Failed to save conversation log: ${response.status}`);
    }
  } catch (error) {
    console.error("Error saving conversation log:", error);
  }
}

serve(async (req) => {
  const { pathname } = new URL(req.url);

  // Health check endpoint
  if (pathname === "/health") {
    return new Response(JSON.stringify({
      status: "healthy",
      connections: sockets.size,
      uptime: performance.now() / 1000,
      timestamp: new Date().toISOString()
    }), {
      headers: { "Content-Type": "application/json" }
    });
  }

  // WebSocket upgrade
  const upgradeHeader = req.headers.get("Upgrade");
  if (upgradeHeader?.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  // Extract URL parameters
  const url = new URL(req.url);
  const callSid = url.searchParams.get("callSid");
  const agentId = url.searchParams.get("agentId");
  const campaignId = url.searchParams.get("campaignId");
  const leadId = url.searchParams.get("leadId");
  
  console.log(`New WebSocket connection: CallSid=${callSid}, AgentId=${agentId}, LeadId=${leadId}`);

  // Set up WebSocket
  const { socket, response } = Deno.upgradeWebSocket(req);
  const connectionId = ++connectionCounter;
  
  // Store connection state
  const connectionState = {
    id: connectionId,
    callSid,
    agentId,
    campaignId, 
    leadId,
    connected: false,
    streamSid: null,
    hasRespondedToMedia: false,
    startTime: Date.now()
  };
  
  // Store the socket
  sockets.set(connectionId, { socket, state: connectionState });

  // Handle WebSocket events
  socket.onopen = () => {
    console.log(`WebSocket ${connectionId} connected for call ${callSid}`);
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`WebSocket ${connectionId} received event: ${data.event}`, data);
      
      // Save event to Supabase for debugging
      if (callSid) {
        await saveConversationLog(callSid, `received_${data.event}`, data);
      }
      
      switch (data.event) {
        case "connected":
          connectionState.connected = true;
          console.log(`WebSocket ${connectionId}: Twilio Media Stream connected`);
          break;
          
        case "start":
          connectionState.streamSid = data.start?.streamSid;
          console.log(`WebSocket ${connectionId}: Media stream started with StreamSid: ${connectionState.streamSid}`);
          
          // Enviar mensagem imediatamente quando o stream iniciar
          if (connectionState.streamSid && !connectionState.hasRespondedToMedia) {
            connectionState.hasRespondedToMedia = true;
            
            console.log(`WebSocket ${connectionId}: Enviando mensagem imediata com voz Camila...`);
            
            const payload = {
              event: "message",
              streamSid: connectionState.streamSid,
              text: "Olá! Aqui é a Voxemy. Como posso te ajudar hoje?",
              voice: "Camila" // Formato simplificado para Polly
            };
            
            console.log(`WebSocket ${connectionId}: Payload para voz Camila:`, payload);
            
            try {
              socket.send(JSON.stringify(payload));
              console.log(`WebSocket ${connectionId}: Mensagem com voz Camila enviada imediatamente!`);
              
              // Log successful send to Supabase
              if (callSid) {
                saveConversationLog(callSid, "sent_message_camila_immediate", payload);
              }
            } catch (sendError) {
              console.error(`WebSocket ${connectionId}: Erro ao enviar mensagem:`, sendError);
            }
          }
          break;
          
        case "media":
          // Log apenas para debug - não enviar novamente
          if (!connectionState.hasRespondedToMedia) {
            console.log(`WebSocket ${connectionId}: Recebido primeiro evento media, mas já enviou no start`);
          }
          break;
          
        case "stop":
          console.log(`WebSocket ${connectionId}: Media stream stopped`);
          
          // Clean up connection
          sockets.delete(connectionId);
          break;
          
        default:
          console.log(`WebSocket ${connectionId}: Unknown event: ${data.event}`);
      }
    } catch (error) {
      console.error(`WebSocket ${connectionId} error processing message:`, error);
      console.error(`Raw message data:`, event.data);
    }
  };

  socket.onclose = (event) => {
    const duration = Date.now() - connectionState.startTime;
    console.log(`WebSocket ${connectionId} closed after ${duration}ms. Code: ${event.code}, Reason: ${event.reason}`);
    sockets.delete(connectionId);
  };

  socket.onerror = (error) => {
    console.error(`WebSocket ${connectionId} error:`, error);
  };

  return response;
});

console.log("Twilio Media Streams WebSocket server started");
console.log("Ready to handle ConversationRelay connections with Camila voice - immediate response");
