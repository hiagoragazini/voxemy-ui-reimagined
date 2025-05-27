
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

// Configurações otimizadas para ElevenLabs (compatível com telefonia)
const ELEVENLABS_CONFIG = {
  voice_id: "FGY2WhTYpPnrIDTdsKH5", // Laura - melhor para português brasileiro
  model_id: "eleven_multilingual_v2",
  voice_settings: {
    stability: 0.5,
    similarity_boost: 0.5,
    style: 0.0,
    use_speaker_boost: false
  },
  output_format: "ulaw_8000" // Formato compatível com telefonia
};

// Cache de respostas comuns
const responseCache = new Map();

serve(async (req) => {
  const upgradeHeader = req.headers.get("Upgrade");
  if (upgradeHeader?.toLowerCase() !== "websocket") {
    return new Response("Expected WebSocket connection", { status: 400 });
  }

  const url = new URL(req.url);
  const callSid = url.searchParams.get("callSid");
  const agentId = url.searchParams.get("agentId");
  
  console.log(`🎯 Nova conexão WebSocket Twilio: CallSid=${callSid}, AgentId=${agentId}`);

  const { socket, response } = Deno.upgradeWebSocket(req);
  
  // Estado da conversa e processamento de áudio
  let conversationHistory: Array<{role: string, content: string}> = [];
  let streamSid: string | null = null;
  let isProcessing = false;
  let audioBuffer: Uint8Array[] = [];
  let lastAudioTime = Date.now();
  let transcriptionInProgress = false;

  // Prompt otimizado para atendimento telefônico brasileiro
  const systemPrompt = `Você é um assistente virtual brasileiro da Voxemy, especializado em atendimento telefônico em tempo real.

REGRAS CRÍTICAS:
- Responda SEMPRE em português brasileiro natural e conversacional
- Seja conciso e direto (máximo 2-3 frases por resposta)
- Use linguagem telefônica apropriada (evite termos técnicos)
- Seja proativo e útil
- Mantenha tom profissional mas caloroso
- Processe a fala do cliente em tempo real e responda adequadamente

CONTEXTO: Esta é uma conversa telefônica ao vivo. O cliente pode interromper ou fazer pausas. Responda baseado no que o cliente disse até o momento.`;

  socket.onopen = () => {
    console.log(`✅ WebSocket Twilio conectado para call ${callSid}`);
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`📨 Evento Twilio recebido:`, data.event, data);
      
      switch (data.event) {
        case "connected":
          console.log(`🔗 Twilio Media Stream conectado`);
          break;
          
        case "start":
          streamSid = data.start?.streamSid;
          console.log(`▶️ Stream iniciado: ${streamSid}`);
          console.log(`📋 Configuração do stream:`, data.start);
          
          // Enviar saudação inicial
          await sendWelcomeMessage();
          break;
          
        case "media":
          // Processar áudio do cliente em tempo real
          if (data.media?.payload && streamSid) {
            await processIncomingAudio(data.media.payload);
          }
          break;
          
        case "stop":
          console.log(`⏹️ Stream finalizado: ${streamSid}`);
          await saveConversationSummary();
          break;
      }
    } catch (error) {
      console.error(`❌ Erro processando evento Twilio:`, error);
    }
  };

  socket.onclose = () => {
    console.log(`🔌 WebSocket Twilio desconectado para call ${callSid}`);
  };

  socket.onerror = (error) => {
    console.error(`💥 Erro WebSocket Twilio:`, error);
  };

  // Função para enviar mensagem de boas-vindas
  async function sendWelcomeMessage() {
    const welcomeText = "Olá! Aqui é a Voxemy. Como posso ajudar você hoje?";
    console.log(`👋 Enviando saudação: "${welcomeText}"`);
    await generateAndSendAudio(welcomeText);
  }

  // Função para processar áudio recebido do cliente
  async function processIncomingAudio(payload: string) {
    try {
      // Decodificar payload base64 para áudio raw
      const audioData = Uint8Array.from(atob(payload), c => c.charCodeAt(0));
      audioBuffer.push(audioData);
      lastAudioTime = Date.now();
      
      // Implementar Voice Activity Detection simples baseado em tempo
      if (!transcriptionInProgress) {
        transcriptionInProgress = true;
        
        // Aguardar 1.5 segundos de silêncio antes de processar
        setTimeout(async () => {
          if (Date.now() - lastAudioTime >= 1500 && audioBuffer.length > 0) {
            await processAudioBuffer();
          }
          transcriptionInProgress = false;
        }, 1500);
      }
      
    } catch (error) {
      console.error(`❌ Erro processando áudio:`, error);
    }
  }

  // Função para processar buffer de áudio acumulado
  async function processAudioBuffer() {
    if (audioBuffer.length === 0 || isProcessing) return;
    
    try {
      isProcessing = true;
      console.log(`🎙️ Processando ${audioBuffer.length} chunks de áudio`);
      
      // Concatenar todos os chunks de áudio
      const totalLength = audioBuffer.reduce((acc, chunk) => acc + chunk.length, 0);
      const combinedAudio = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of audioBuffer) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }
      
      // Limpar buffer
      audioBuffer = [];
      
      // Converter áudio para formato WAV para Whisper
      const wavAudio = convertToWav(combinedAudio);
      
      // Transcrever áudio
      const transcription = await transcribeAudio(wavAudio);
      
      if (transcription && transcription.trim().length > 0) {
        console.log(`📝 Transcrição: "${transcription}"`);
        
        // Gerar resposta da IA
        await processUserSpeech(transcription);
      } else {
        console.log(`⚠️ Transcrição vazia ou inválida`);
      }
      
    } catch (error) {
      console.error(`❌ Erro processando buffer de áudio:`, error);
    } finally {
      isProcessing = false;
    }
  }

  // Função para converter áudio ulaw para WAV
  function convertToWav(audioData: Uint8Array): ArrayBuffer {
    // Converter μ-law para PCM 16-bit
    const pcmData = new Int16Array(audioData.length);
    
    for (let i = 0; i < audioData.length; i++) {
      // Decodificação μ-law simplificada
      const sample = audioData[i];
      const sign = (sample & 0x80) ? -1 : 1;
      const magnitude = ((sample & 0x7F) ^ 0x55);
      const step = magnitude << 3;
      pcmData[i] = sign * (step + 4);
    }
    
    // Criar header WAV
    const wavBuffer = new ArrayBuffer(44 + pcmData.byteLength);
    const view = new DataView(wavBuffer);
    
    // Header WAV
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + pcmData.byteLength, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 8000, true);
    view.setUint32(28, 16000, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, pcmData.byteLength, true);
    
    // Copiar dados PCM
    const pcmBytes = new Uint8Array(pcmData.buffer);
    const wavBytes = new Uint8Array(wavBuffer);
    wavBytes.set(pcmBytes, 44);
    
    return wavBuffer;
  }

  // Função para transcrever áudio usando OpenAI Whisper
  async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string | null> {
    if (!OPENAI_API_KEY) {
      console.error("❌ OPENAI_API_KEY não configurada");
      return null;
    }

    try {
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');
      formData.append('temperature', '0.2');

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Whisper API error: ${response.status}`);
      }

      const result = await response.json();
      return result.text?.trim() || null;
    } catch (error) {
      console.error(`❌ Erro na transcrição:`, error);
      return null;
    }
  }

  // Função para processar fala do usuário e gerar resposta
  async function processUserSpeech(userText: string) {
    try {
      console.log(`👤 Processando fala: "${userText}"`);
      
      // Verificar cache primeiro
      const cacheKey = userText.toLowerCase().trim();
      if (responseCache.has(cacheKey)) {
        const cachedResponse = responseCache.get(cacheKey);
        console.log(`⚡ Resposta do cache: "${cachedResponse}"`);
        await generateAndSendAudio(cachedResponse);
        return;
      }
      
      // Adicionar à história da conversa
      conversationHistory.push({ role: "user", content: userText });
      
      // Manter apenas últimas 8 mensagens para performance
      if (conversationHistory.length > 8) {
        conversationHistory = conversationHistory.slice(-8);
      }
      
      // Gerar resposta com OpenAI
      const aiResponse = await generateAIResponse();
      
      if (aiResponse) {
        console.log(`🤖 Resposta da IA: "${aiResponse}"`);
        
        // Adicionar à história
        conversationHistory.push({ role: "assistant", content: aiResponse });
        
        // Cache respostas curtas
        if (userText.length < 50) {
          responseCache.set(cacheKey, aiResponse);
        }
        
        // Gerar e enviar áudio
        await generateAndSendAudio(aiResponse);
      }
    } catch (error) {
      console.error(`❌ Erro processando fala do usuário:`, error);
      await generateAndSendAudio("Desculpe, não consegui entender. Pode repetir?");
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
          max_tokens: 100, // Respostas bem curtas para telefone
          temperature: 0.7,
          presence_penalty: 0.3,
          frequency_penalty: 0.3
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content?.trim() || null;
    } catch (error) {
      console.error(`❌ Erro gerando resposta IA:`, error);
      return null;
    }
  }

  // Função para gerar áudio e enviar via Twilio
  async function generateAndSendAudio(text: string) {
    if (!streamSid) {
      console.warn("⚠️ Sem streamSid disponível");
      return;
    }

    try {
      console.log(`🎙️ Gerando áudio para: "${text}"`);
      
      // Gerar áudio com ElevenLabs
      const audioBase64 = await generateOptimizedAudio(text);
      
      if (audioBase64) {
        // Enviar áudio para o Twilio no formato correto
        const mediaMessage = {
          event: "media",
          streamSid: streamSid,
          media: {
            payload: audioBase64
          }
        };
        
        socket.send(JSON.stringify(mediaMessage));
        console.log(`🔊 Áudio enviado para Twilio (${audioBase64.length} chars base64)`);
        
        // Salvar no banco de dados
        await saveConversationLog("ai_response", { text, audio_generated: true });
      } else {
        console.warn("⚠️ Falha ao gerar áudio");
      }
    } catch (error) {
      console.error(`❌ Erro enviando áudio:`, error);
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
      
      console.log(`✅ Áudio ElevenLabs gerado (${audioBuffer.byteLength} bytes)`);
      return base64Audio;
    } catch (error) {
      console.error(`❌ Erro gerando áudio ElevenLabs:`, error);
      return null;
    }
  }

  // Função para salvar log da conversa
  async function saveConversationLog(event: string, data: any) {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !callSid) return;

    try {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      const logEntry = {
        event,
        data,
        timestamp: new Date().toISOString(),
        conversation_history: conversationHistory
      };
      
      await supabase
        .from("call_logs")
        .update({
          conversation_log: JSON.stringify(logEntry),
          transcription: JSON.stringify(conversationHistory)
        })
        .eq("call_sid", callSid);
    } catch (error) {
      console.error("❌ Erro salvando log:", error);
    }
  }

  // Função para salvar resumo da conversa
  async function saveConversationSummary() {
    if (conversationHistory.length > 0) {
      console.log(`📋 Salvando resumo da conversa (${conversationHistory.length} mensagens)`);
      await saveConversationLog("conversation_ended", {
        total_messages: conversationHistory.length,
        summary: conversationHistory
      });
    }
  }

  return response;
});

console.log("🚀 Servidor WebSocket Twilio ConversationRelay iniciado com processamento de áudio em tempo real");
