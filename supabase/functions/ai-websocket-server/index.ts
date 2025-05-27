
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Configurações otimizadas para ElevenLabs (voz Laura com qualidade aprimorada)
const ELEVENLABS_CONFIG = {
  voice_id: "FGY2WhTYpPnrIDTdsKH5", // Laura - melhor para português brasileiro
  model_id: "eleven_multilingual_v2", // Modelo mais avançado
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.5,
    style: 0.0,
    use_speaker_boost: false // Desativado para evitar distorção
  },
  output_format: "mp3_44100_128" // Qualidade otimizada para telefone
};

// Cache de respostas comuns para reduzir latência
const responseCache = new Map();

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
  
  // Estado da conversa
  let conversationHistory: Array<{role: string, content: string}> = [];
  let isProcessing = false;
  let streamSid: string | null = null;

  // Prompt otimizado para atendimento telefônico brasileiro
  const systemPrompt = `Você é um assistente virtual brasileiro da Voxemy, especializado em atendimento telefônico.

REGRAS IMPORTANTES:
- Responda SEMPRE em português brasileiro
- Seja conciso, direto e amigável 
- Use linguagem natural e conversacional
- Evite respostas muito longas (máximo 2-3 frases)
- Seja proativo em ajudar o cliente
- Use tom profissional mas caloroso

CONTEXTO: Esta é uma conversa telefônica em tempo real. Mantenha respostas rápidas e claras.`;

  socket.onopen = () => {
    console.log(`✅ WebSocket conectado para call ${callSid}`);
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`📨 Evento recebido: ${data.event}`, data);
      
      switch (data.event) {
        case "connected":
          console.log(`🔗 Twilio Media Stream conectado`);
          break;
          
        case "start":
          streamSid = data.start?.streamSid;
          console.log(`▶️ Stream iniciado: ${streamSid}`);
          
          // Enviar mensagem de boas-vindas imediatamente
          await sendAIResponse("Olá! Aqui é a Voxemy. Como posso ajudar você hoje?", socket, streamSid);
          break;
          
        case "media":
          // Processar áudio do cliente (para futura implementação de transcrição)
          break;
          
        case "stop":
          console.log(`⏹️ Stream finalizado`);
          break;
          
        // Eventos personalizados para processamento de texto
        case "user_message":
          if (!isProcessing && data.text?.trim()) {
            await processUserMessage(data.text, socket, streamSid);
          }
          break;
      }
    } catch (error) {
      console.error(`❌ Erro processando mensagem:`, error);
    }
  };

  socket.onclose = () => {
    console.log(`🔌 WebSocket desconectado para call ${callSid}`);
  };

  socket.onerror = (error) => {
    console.error(`💥 Erro WebSocket:`, error);
  };

  // Função para processar mensagem do usuário
  async function processUserMessage(userText: string, socket: WebSocket, streamSid: string | null) {
    if (isProcessing) return;
    
    try {
      isProcessing = true;
      console.log(`👤 Processando mensagem do usuário: "${userText}"`);
      
      // Verificar cache primeiro
      const cacheKey = userText.toLowerCase().trim();
      if (responseCache.has(cacheKey)) {
        const cachedResponse = responseCache.get(cacheKey);
        console.log(`⚡ Resposta do cache: "${cachedResponse}"`);
        await sendAIResponse(cachedResponse, socket, streamSid);
        return;
      }
      
      // Adicionar à história da conversa
      conversationHistory.push({ role: "user", content: userText });
      
      // Manter apenas últimas 10 mensagens para performance
      if (conversationHistory.length > 10) {
        conversationHistory = conversationHistory.slice(-10);
      }
      
      // Gerar resposta com OpenAI
      const aiResponse = await generateAIResponse();
      
      if (aiResponse) {
        // Adicionar à história
        conversationHistory.push({ role: "assistant", content: aiResponse });
        
        // Cache respostas comuns
        if (userText.length < 50) {
          responseCache.set(cacheKey, aiResponse);
        }
        
        // Enviar resposta
        await sendAIResponse(aiResponse, socket, streamSid);
      }
    } catch (error) {
      console.error(`❌ Erro processando mensagem do usuário:`, error);
      await sendAIResponse("Desculpe, tive um problema técnico. Pode repetir por favor?", socket, streamSid);
    } finally {
      isProcessing = false;
    }
  }

  // Função para gerar resposta da IA
  async function generateAIResponse(): Promise<string | null> {
    if (!OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY não configurada");
      return "Desculpe, estou com problemas técnicos no momento.";
    }

    try {
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
            ...conversationHistory
          ],
          max_tokens: 150, // Respostas curtas para telefone
          temperature: 0.7,
          presence_penalty: 0.3,
          frequency_penalty: 0.3
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      const aiMessage = data.choices[0]?.message?.content?.trim();
      
      console.log(`🤖 Resposta da IA: "${aiMessage}"`);
      return aiMessage;
    } catch (error) {
      console.error(`❌ Erro gerando resposta IA:`, error);
      return null;
    }
  }

  // Função para enviar resposta via ElevenLabs e Twilio
  async function sendAIResponse(text: string, socket: WebSocket, streamSid: string | null) {
    if (!streamSid) {
      console.warn("⚠️ Sem streamSid disponível");
      return;
    }

    try {
      console.log(`🎙️ Convertendo texto para áudio: "${text}"`);
      
      // Gerar áudio com ElevenLabs (configurações otimizadas)
      const audioBase64 = await generateOptimizedAudio(text);
      
      if (audioBase64) {
        // Enviar áudio para o Twilio
        const mediaMessage = {
          event: "media",
          streamSid: streamSid,
          media: {
            payload: audioBase64
          }
        };
        
        socket.send(JSON.stringify(mediaMessage));
        console.log(`🔊 Áudio enviado para Twilio`);
        
        // Salvar no banco de dados para análise
        await saveConversationLog(callSid, "ai_response", { text, audio_generated: true });
      } else {
        console.warn("⚠️ Falha ao gerar áudio, enviando mensagem de erro");
      }
    } catch (error) {
      console.error(`❌ Erro enviando resposta:`, error);
    }
  }

  // Função para gerar áudio otimizado com ElevenLabs
  async function generateOptimizedAudio(text: string): Promise<string | null> {
    if (!ELEVENLABS_API_KEY) {
      console.warn("⚠️ ElevenLabs API key não disponível");
      return null;
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_CONFIG.voice_id}`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: ELEVENLABS_CONFIG.model_id,
          voice_settings: ELEVENLABS_CONFIG.voice_settings,
          output_format: ELEVENLABS_CONFIG.output_format
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
      
      console.log(`✅ Áudio gerado com sucesso (${audioBuffer.byteLength} bytes)`);
      return base64Audio;
    } catch (error) {
      console.error(`❌ Erro gerando áudio:`, error);
      return null;
    }
  }

  // Função para salvar log da conversa
  async function saveConversationLog(callSid: string | null, event: string, data: any) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !callSid) return;

    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      await supabase
        .from("call_logs")
        .update({
          conversation_log: JSON.stringify({ 
            event, 
            data, 
            timestamp: new Date().toISOString() 
          })
        })
        .eq("call_sid", callSid);
    } catch (error) {
      console.error("❌ Erro salvando log:", error);
    }
  }

  return response;
});

console.log("🚀 Servidor WebSocket de IA iniciado com ElevenLabs otimizado");
