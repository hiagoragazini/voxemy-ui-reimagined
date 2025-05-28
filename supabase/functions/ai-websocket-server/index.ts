
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

console.log("🚀 Iniciando servidor WebSocket ConversationRelay Protocol");
console.log(`📊 APIs: OpenAI=${!!OPENAI_API_KEY}, ElevenLabs=${!!ELEVENLABS_API_KEY}`);

serve(async (req) => {
  const upgradeHeader = req.headers.get("Upgrade");
  if (upgradeHeader?.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const url = new URL(req.url);
  const callSid = url.searchParams.get("callSid");
  const agentId = url.searchParams.get("agentId");
  
  console.log(`🎯 Nova conexão WebSocket: CallSid=${callSid}, AgentId=${agentId}`);

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  // Estado da conexão
  let isConnected = false;
  let hasStarted = false;
  let hasGreeted = false;
  let conversationHistory: Array<{role: string, content: string, timestamp: string}> = [];
  let lastTranscript = "";
  let heartbeatInterval: number | null = null;

  const systemPrompt = `Você é Laura, assistente virtual brasileira da Voxemy para atendimento telefônico.

INSTRUÇÕES CRÍTICAS:
- Seja natural, amigável e concisa (máximo 2 frases)
- Use português brasileiro coloquial para telefone
- Processe o que o cliente disse e responda adequadamente
- Se não entender, peça para repetir educadamente
- Mantenha a conversa fluindo naturalmente

Esta é uma conversa telefônica ao vivo em tempo real.`;

  // Função para salvar logs
  async function saveConversationLog(event: string, data: any) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !callSid) return;

    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      await supabase
        .from("call_logs")
        .update({
          conversation_log: JSON.stringify({
            event,
            data,
            timestamp: new Date().toISOString(),
            conversation_history: conversationHistory
          }),
          transcription: JSON.stringify(conversationHistory),
          status: "conversation_active"
        })
        .eq("call_sid", callSid);
    } catch (error) {
      console.error("❌ Erro salvando log:", error);
    }
  }

  // Função para gerar resposta da IA
  async function generateAIResponse(userText: string): Promise<string | null> {
    if (!OPENAI_API_KEY) {
      return "Desculpe, estou com problemas técnicos no momento.";
    }

    try {
      conversationHistory.push({
        role: "user",
        content: userText,
        timestamp: new Date().toISOString()
      });

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...conversationHistory.slice(-6).map(h => ({ role: h.role, content: h.content }))
          ],
          max_tokens: 100,
          temperature: 0.7
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices[0]?.message?.content?.trim();
      
      if (aiResponse) {
        conversationHistory.push({
          role: "assistant",
          content: aiResponse,
          timestamp: new Date().toISOString()
        });
      }
      
      return aiResponse;
    } catch (error) {
      console.error(`❌ Erro gerando resposta IA:`, error);
      return "Desculpe, não entendi bem. Pode repetir?";
    }
  }

  // Função para enviar resposta de áudio no protocolo ConversationRelay
  async function sendSpeakEvent(text: string) {
    if (!isConnected) return;

    console.log(`🎙️ Enviando speak event: "${text}"`);
    
    const speakEvent = {
      event: "speak",
      text: text,
      config: {
        provider: "elevenlabs",
        voice_id: "FGY2WhTYpPnrIDTdsKH5", // Laura - voz brasileira
        stability: 0.35,
        similarity: 0.75,
        style: 0.4,
        speed: 0.95,
        audio_format: "ulaw_8000" // Formato telefônico obrigatório
      }
    };
    
    if (ELEVENLABS_API_KEY) {
      speakEvent.config.provider = "elevenlabs";
    } else {
      // Fallback para TTS padrão do Twilio
      delete speakEvent.config.provider;
      delete speakEvent.config.voice_id;
      delete speakEvent.config.stability;
      delete speakEvent.config.similarity;
      delete speakEvent.config.style;
      delete speakEvent.config.speed;
      console.log("⚠️ Usando TTS padrão do Twilio (ElevenLabs não disponível)");
    }
    
    try {
      socket.send(JSON.stringify(speakEvent));
      console.log(`✅ Speak event enviado com sucesso`);
      await saveConversationLog("ai_response", { text, config: speakEvent.config });
    } catch (error) {
      console.error(`❌ Erro enviando speak event:`, error);
    }
  }

  // Configurar heartbeat para manter conexão ativa
  function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    
    heartbeatInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.ping();
          console.log("❤️ Heartbeat enviado");
        } catch (error) {
          console.error("❌ Erro enviando heartbeat:", error);
        }
      }
    }, 25000); // A cada 25 segundos
  }

  // Função de log detalhado
  function logEvent(type: string, data: any) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${type}: ${JSON.stringify(data)}`);
  }

  // Eventos WebSocket
  socket.onopen = () => {
    console.log(`✅ WebSocket aberto para call ${callSid}`);
    startHeartbeat();
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      logEvent("RECEIVED", data);
      
      switch (data.event) {
        case "connected":
          console.log(`🤝 Evento connected recebido - respondendo handshake`);
          isConnected = true;
          
          // CRÍTICO: Responder imediatamente ao handshake
          const connectedResponse = { event: "connected" };
          socket.send(JSON.stringify(connectedResponse));
          logEvent("SENT", connectedResponse);
          break;
          
        case "start":
          console.log(`🚀 Evento start recebido - iniciando conversa`);
          hasStarted = true;
          
          // Enviar mensagem de boas-vindas imediatamente
          if (!hasGreeted) {
            hasGreeted = true;
            await sendSpeakEvent("Olá! Aqui é a Laura da Voxemy. Como posso ajudar você hoje?");
          }
          break;
          
        case "media":
          // Evento de áudio do usuário - apenas loggar (não precisa processar)
          console.log(`🎤 Evento media recebido (audio chunk)`);
          break;
          
        case "transcript":
          if (data.transcript && data.transcript.speech) {
            const userSpeech = data.transcript.speech.trim();
            console.log(`💬 Transcrição recebida: "${userSpeech}"`);
            
            // Evitar processar transcrições duplicadas ou muito curtas
            if (userSpeech.length > 2 && userSpeech !== lastTranscript) {
              lastTranscript = userSpeech;
              
              // Gerar resposta da IA
              const aiResponse = await generateAIResponse(userSpeech);
              
              if (aiResponse) {
                await sendSpeakEvent(aiResponse);
              }
            }
          }
          break;
          
        case "mark":
          console.log(`🔖 Evento mark recebido: ${data.mark}`);
          // Não requer resposta
          break;
          
        case "stop":
          console.log(`🛑 Evento stop recebido - encerrando conexão`);
          await saveConversationLog("conversation_ended", {
            total_messages: conversationHistory.length,
            final_history: conversationHistory
          });
          
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          
          socket.close();
          break;
          
        default:
          console.log(`❓ Evento desconhecido: ${data.event}`);
          logEvent("UNKNOWN_EVENT", data);
          break;
      }
    } catch (error) {
      console.error(`❌ Erro processando evento:`, error);
      logEvent("ERROR", { error: error.message, raw_data: event.data });
    }
  };

  socket.onclose = () => {
    console.log(`🔌 WebSocket fechado para call ${callSid}`);
    isConnected = false;
    
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };

  socket.onerror = (error) => {
    console.error(`💥 Erro WebSocket para call ${callSid}:`, error);
    logEvent("WEBSOCKET_ERROR", error);
  };

  socket.onpong = () => {
    console.log("🏓 Pong recebido - conexão ativa");
  };

  return response;
});

console.log("🚀 Servidor WebSocket ConversationRelay Protocol pronto");
