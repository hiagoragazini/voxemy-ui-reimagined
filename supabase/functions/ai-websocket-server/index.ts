
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

console.log("🚀 WebSocket Server ConversationRelay - FALLBACK CORRIGIDO - Vozes Nativas Twilio");
console.log(`📊 APIs: OpenAI=${!!OPENAI_API_KEY}, Supabase=${!!SUPABASE_URL}`);
console.log(`🔧 Modo: FALLBACK para quando servidor externo não disponível`);

serve(async (req) => {
  const upgradeHeader = req.headers.get("Upgrade");
  if (upgradeHeader?.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const url = new URL(req.url);
  const callSid = url.searchParams.get("callSid");
  const agentId = url.searchParams.get("agentId");
  
  console.log(`🎯 FALLBACK WebSocket: CallSid=${callSid}, AgentId=${agentId}`);

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  // Estado da conexão
  let isConnected = false;
  let hasStarted = false;
  let hasGreeted = false;
  let conversationHistory: Array<{role: string, content: string, timestamp: string, confidence?: number}> = [];
  let lastTranscript = "";
  let heartbeatInterval: number | null = null;

  const systemPrompt = `Você é Laura, assistente virtual brasileira da Voxemy para atendimento telefônico.

INSTRUÇÕES CRÍTICAS - VERSÃO CORRIGIDA:
- Seja natural, amigável e concisa (máximo 2 frases por resposta)
- Use português brasileiro coloquial apropriado para telefone
- Processe completamente o que o cliente disse antes de responder
- Se não entender claramente, peça para repetir de forma educada
- Mantenha a conversa fluindo naturalmente
- Evite repetições desnecessárias
- Foque em ajudar o cliente de forma prática

Esta é uma conversa telefônica ao vivo em tempo real - SISTEMA CORRIGIDO.`;

  // Função para salvar logs - CORRIGIDA
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
            conversation_history: conversationHistory,
            server: 'supabase_fallback_corrected'
          }),
          transcription: JSON.stringify(conversationHistory),
          status: event === "conversation_ended" ? "completed" : "conversation_active"
        })
        .eq("call_sid", callSid);
        
      console.log(`📝 Log salvo (FALLBACK): ${event}`);
    } catch (error) {
      console.error("❌ Erro salvando log (FALLBACK):", error);
    }
  }

  // Função para gerar resposta da IA - MELHORADA
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
            ...conversationHistory.slice(-8).map(h => ({ role: h.role, content: h.content }))
          ],
          max_tokens: 120,
          temperature: 0.7,
          presence_penalty: 0.3,
          frequency_penalty: 0.3
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
        
        console.log(`🤖 Resposta IA (FALLBACK): "${aiResponse}"`);
      }
      
      return aiResponse;
    } catch (error) {
      console.error(`❌ Erro gerando resposta IA (FALLBACK):`, error);
      return "Desculpe, não consegui processar sua mensagem. Pode tentar novamente?";
    }
  }

  // Função para enviar resposta de áudio - CORRIGIDA
  async function sendSpeakEvent(text: string) {
    if (!isConnected) return;

    console.log(`🎙️ FALLBACK - Enviando speak com voz NATIVA: "${text}"`);
    
    const speakEvent = {
      event: "speak",
      text: text,
      config: {
        voice: "pt-BR-FranciscaNeural", // Voz brasileira nativa
        rate: "0.95",
        pitch: "medium",
        audio_format: "ulaw_8000"
      }
    };
    
    try {
      socket.send(JSON.stringify(speakEvent));
      console.log(`✅ FALLBACK - Speak event enviado com sucesso`);
      await saveConversationLog("ai_response_fallback", { text, config: speakEvent.config });
    } catch (error) {
      console.error(`❌ FALLBACK - Erro enviando speak:`, error);
    }
  }

  // Configurar heartbeat - MELHORADO
  function startHeartbeat() {
    if (heartbeatInterval) clearInterval(heartbeatInterval);
    
    heartbeatInterval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        try {
          socket.ping();
          console.log("❤️ FALLBACK - Heartbeat enviado");
        } catch (error) {
          console.error("❌ FALLBACK - Erro heartbeat:", error);
        }
      }
    }, 25000);
  }

  // Eventos WebSocket - PROTOCOLO CORRIGIDO
  socket.onopen = () => {
    console.log(`✅ FALLBACK WebSocket aberto para call ${callSid} - VOZ NATIVA`);
    startHeartbeat();
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`📨 FALLBACK - Evento recebido: ${data.event}`);
      
      switch (data.event) {
        case "connected":
          console.log(`🤝 FALLBACK - Handshake recebido`);
          isConnected = true;
          
          const connectedResponse = { event: "connected" };
          socket.send(JSON.stringify(connectedResponse));
          console.log(`✅ FALLBACK - Handshake respondido`);
          
          await saveConversationLog("handshake_completed_fallback", { success: true });
          break;
          
        case "start":
          console.log(`🚀 FALLBACK - Call start com VOZ NATIVA`);
          hasStarted = true;
          
          if (!hasGreeted) {
            hasGreeted = true;
            await sendSpeakEvent("Olá! Aqui é a Laura da Voxemy pelo sistema de backup. Como posso ajudar você hoje?");
          }
          break;
          
        case "media":
          // Log apenas ocasional para não poluir
          if (Math.random() < 0.005) {
            console.log(`🎤 FALLBACK - Media chunk recebido`);
          }
          break;
          
        case "transcript":
          if (data.transcript && data.transcript.speech) {
            const userSpeech = data.transcript.speech.trim();
            const confidence = data.transcript.confidence || 0;
            const isFinal = data.transcript.is_final;
            
            console.log(`💬 FALLBACK - Transcrição: "${userSpeech}" (conf: ${confidence})`);
            
            if (isFinal && userSpeech.length > 2 && userSpeech !== lastTranscript && confidence > 0.7) {
              lastTranscript = userSpeech;
              
              await saveConversationLog("user_speech_fallback", { 
                text: userSpeech, 
                confidence: confidence 
              });
              
              const aiResponse = await generateAIResponse(userSpeech);
              
              if (aiResponse) {
                await sendSpeakEvent(aiResponse);
              }
            }
          }
          break;
          
        case "mark":
          console.log(`🔖 FALLBACK - Mark: ${data.mark}`);
          break;
          
        case "stop":
          console.log(`🛑 FALLBACK - Call ended`);
          await saveConversationLog("conversation_ended_fallback", {
            total_messages: conversationHistory.length,
            final_history: conversationHistory,
            server: 'supabase_fallback_corrected'
          });
          
          if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
            heartbeatInterval = null;
          }
          
          socket.close();
          break;
          
        default:
          console.log(`❓ FALLBACK - Evento desconhecido: ${data.event}`);
          break;
      }
    } catch (error) {
      console.error(`❌ FALLBACK - Erro processando evento:`, error);
    }
  };

  socket.onclose = () => {
    console.log(`🔌 FALLBACK WebSocket fechado para call ${callSid}`);
    isConnected = false;
    
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
  };

  socket.onerror = (error) => {
    console.error(`💥 FALLBACK WebSocket erro para call ${callSid}:`, error);
  };

  socket.onpong = () => {
    console.log("🏓 FALLBACK - Pong recebido");
  };

  return response;
});

console.log("🚀 FALLBACK WebSocket Server pronto - SISTEMA CORRIGIDO");
console.log("🎤 Configurado para usar vozes brasileiras nativas como FALLBACK");
console.log("🔧 Sistema de backup para quando servidor Railway não disponível");
