
// NOTE: This file is a template for deploying to Deno Deploy.
// It is not intended to be deployed as a Supabase Edge Function.
// Deploy this to Deno Deploy separately.

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

// Setup simple WebSocket server
const sockets = new Map();
let connectionCounter = 0;

// OpenAI client setup
const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!OPENAI_API_KEY) {
  console.error("Missing OPENAI_API_KEY environment variable");
}

// Process conversation with OpenAI
async function processConversation(text: string, history: any[]) {
  try {
    const messages = [
      {
        role: "system",
        content: "Você é um assistente de voz amigável e prestativo da Voxemy. " +
                 "Suas respostas devem ser claras, concisas e naturais para comunicação por voz. " +
                 "Evite respostas muito longas ou complexas. Mantenha um tom conversacional e amigável."
      },
      ...history,
      { role: "user", content: text }
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // or a more appropriate model
        messages,
        temperature: 0.7,
        max_tokens: 150,
        top_p: 1.0,
        frequency_penalty: 0.0,
        presence_penalty: 0.0,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error processing with OpenAI:", error);
    return "Desculpe, tive um problema ao processar sua solicitação. Pode tentar novamente?";
  }
}

// Save conversation to Supabase
async function saveConversation(callSid: string, agentId: string | null, leadId: string | null, transcript: any[]) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.warn("Supabase credentials missing, cannot save conversation");
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
        transcription: JSON.stringify(transcript),
        transcription_status: "completed"
      })
    });

    if (!response.ok) {
      throw new Error(`Supabase API error: ${response.status}`);
    }
    
    console.log(`Saved transcript for call ${callSid}`);
  } catch (error) {
    console.error("Error saving conversation to Supabase:", error);
  }
}

serve(async (req) => {
  const { pathname } = new URL(req.url);

  // Health check endpoint
  if (pathname === "/health") {
    return new Response(JSON.stringify({
      status: "healthy",
      connections: sockets.size,
      uptime: performance.now() / 1000
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
  
  // Store conversation state
  const connectionState = {
    id: connectionId,
    callSid,
    agentId,
    campaignId, 
    leadId,
    connected: false,
    history: [],
    transcript: []
  };
  
  // Store the socket
  sockets.set(connectionId, { socket, state: connectionState });

  // Handle WebSocket events
  socket.onopen = () => {
    console.log(`WebSocket ${connectionId} connected`);
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`WebSocket ${connectionId} received:`, data.event);
      
      switch (data.event) {
        case "connected":
          connectionState.connected = true;
          console.log(`WebSocket ${connectionId}: ConversationRelay connected`);
          break;
          
        case "start":
          console.log(`WebSocket ${connectionId}: Call started`);
          // Additional call metadata could be stored here
          break;
          
        case "media":
          if (data.media?.transcript) {
            const transcript = data.media.transcript;
            
            if (transcript.is_final) {
              console.log(`WebSocket ${connectionId}: Final transcript: ${transcript.text}`);
              
              // Store user message in history and transcript
              connectionState.history.push({
                role: "user",
                content: transcript.text
              });
              
              connectionState.transcript.push({
                role: "user",
                text: transcript.text,
                timestamp: new Date().toISOString()
              });
              
              // Process with OpenAI
              const response = await processConversation(
                transcript.text, 
                connectionState.history
              );
              
              // Store assistant response in history and transcript
              connectionState.history.push({
                role: "assistant",
                content: response
              });
              
              connectionState.transcript.push({
                role: "assistant",
                text: response,
                timestamp: new Date().toISOString()
              });
              
              // Send response to ConversationRelay
              socket.send(JSON.stringify({
                event: "media",
                media: {
                  payload: response
                }
              }));
              
              console.log(`WebSocket ${connectionId}: Sent response: ${response}`);
              
              // Periodically save conversation to Supabase
              if (connectionState.transcript.length % 2 === 0 && callSid) {
                await saveConversation(
                  callSid,
                  agentId,
                  leadId,
                  connectionState.transcript
                );
              }
            }
          }
          break;
          
        case "stop":
          console.log(`WebSocket ${connectionId}: Call ended`);
          
          // Save final conversation to Supabase
          if (callSid && connectionState.transcript.length > 0) {
            await saveConversation(
              callSid,
              agentId,
              leadId,
              connectionState.transcript
            );
          }
          
          // Clean up connection
          sockets.delete(connectionId);
          break;
          
        default:
          console.log(`WebSocket ${connectionId}: Unknown event: ${data.event}`);
      }
    } catch (error) {
      console.error(`WebSocket ${connectionId} error processing message:`, error);
    }
  };

  socket.onclose = () => {
    console.log(`WebSocket ${connectionId} closed`);
    sockets.delete(connectionId);
  };

  socket.onerror = (error) => {
    console.error(`WebSocket ${connectionId} error:`, error);
  };

  return response;
});

console.log("WebSocket server started");
