
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const ELEVENLABS_API_KEY = Deno.env.get("ELEVENLABS_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

console.log("🚀 Iniciando servidor WebSocket otimizado para ConversationRelay");
console.log(`📊 APIs disponíveis: OpenAI=${!!OPENAI_API_KEY}, ElevenLabs=${!!ELEVENLABS_API_KEY}`);

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
  let conversationHistory: Array<{role: string, content: string, timestamp: string}> = [];
  let streamSid: string | null = null;
  let audioBuffer: Uint8Array[] = [];
  let lastSpeechTime = Date.now();
  let isProcessingAudio = false;
  let hasGreeted = false;

  const systemPrompt = `Você é Laura, assistente virtual brasileira da Voxemy, especializada em atendimento telefônico.

INSTRUÇÕES CRÍTICAS:
- Responda SEMPRE em português brasileiro natural e conversacional
- Seja concisa (máximo 2 frases por resposta)
- Use linguagem telefônica apropriada e amigável
- Seja proativa e útil
- Se o cliente não falar por 3 segundos, faça uma pergunta para manter a conversa
- Processe a fala do cliente e responda adequadamente

Esta é uma conversa telefônica ao vivo. O cliente pode interromper ou fazer pausas.`;

  // Função para salvar logs de conversa
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
      // Adicionar fala do usuário ao histórico
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
          max_tokens: 150,
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
      return "Desculpe, não entendi. Pode repetir?";
    }
  }

  // Função para gerar áudio com ElevenLabs
  async function generateAudio(text: string): Promise<string | null> {
    if (!ELEVENLABS_API_KEY) {
      console.warn("⚠️ ElevenLabs não disponível");
      return null;
    }

    try {
      const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/FGY2WhTYpPnrIDTdsKH5`, {
        method: "POST",
        headers: {
          "Accept": "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": ELEVENLABS_API_KEY,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: false
          },
          output_format: "ulaw_8000"
        }),
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs error: ${response.status}`);
      }

      const audioBuffer = await response.arrayBuffer();
      const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
      
      console.log(`✅ Áudio gerado: ${text.substring(0, 50)}... (${audioBuffer.byteLength} bytes)`);
      return base64Audio;
    } catch (error) {
      console.error(`❌ Erro ElevenLabs:`, error);
      return null;
    }
  }

  // Função para transcrever áudio
  async function transcribeAudio(audioBuffer: ArrayBuffer): Promise<string | null> {
    if (!OPENAI_API_KEY) return null;

    try {
      const formData = new FormData();
      const audioBlob = new Blob([audioBuffer], { type: 'audio/wav' });
      formData.append('file', audioBlob, 'audio.wav');
      formData.append('model', 'whisper-1');
      formData.append('language', 'pt');

      const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
        },
        body: formData,
      });

      if (!response.ok) return null;
      
      const result = await response.json();
      return result.text?.trim() || null;
    } catch (error) {
      console.error(`❌ Erro transcrição:`, error);
      return null;
    }
  }

  // Função para converter μ-law para WAV
  function convertUlawToWav(audioData: Uint8Array): ArrayBuffer {
    const pcmData = new Int16Array(audioData.length);
    
    // Tabela de decodificação μ-law simplificada
    for (let i = 0; i < audioData.length; i++) {
      const sample = audioData[i];
      const sign = (sample & 0x80) ? -1 : 1;
      const magnitude = ((sample & 0x7F) ^ 0x55);
      pcmData[i] = sign * (magnitude << 3);
    }
    
    // Criar header WAV
    const wavBuffer = new ArrayBuffer(44 + pcmData.byteLength);
    const view = new DataView(wavBuffer);
    
    // Header WAV padrão
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
    
    const wavBytes = new Uint8Array(wavBuffer);
    wavBytes.set(new Uint8Array(pcmData.buffer), 44);
    
    return wavBuffer;
  }

  // Função para enviar áudio de resposta
  async function sendAudioResponse(text: string) {
    if (!streamSid) return;

    console.log(`🎙️ Gerando resposta: "${text}"`);
    
    const audioBase64 = await generateAudio(text);
    
    if (audioBase64) {
      const mediaMessage = {
        event: "media",
        streamSid: streamSid,
        media: {
          payload: audioBase64
        }
      };
      
      socket.send(JSON.stringify(mediaMessage));
      console.log(`🔊 Áudio enviado para Twilio`);
      
      await saveConversationLog("ai_response", { text, audio_sent: true });
    }
  }

  // Função para processar buffer de áudio acumulado
  async function processAudioBuffer() {
    if (audioBuffer.length === 0 || isProcessingAudio) return;
    
    try {
      isProcessingAudio = true;
      console.log(`🎤 Processando ${audioBuffer.length} chunks de áudio`);
      
      // Concatenar chunks
      const totalLength = audioBuffer.reduce((acc, chunk) => acc + chunk.length, 0);
      const combinedAudio = new Uint8Array(totalLength);
      let offset = 0;
      
      for (const chunk of audioBuffer) {
        combinedAudio.set(chunk, offset);
        offset += chunk.length;
      }
      
      audioBuffer = []; // Limpar buffer
      
      // Converter para WAV
      const wavAudio = convertUlawToWav(combinedAudio);
      
      // Transcrever
      const transcription = await transcribeAudio(wavAudio);
      
      if (transcription && transcription.trim().length > 2) {
        console.log(`📝 Transcrição: "${transcription}"`);
        
        // Gerar resposta
        const aiResponse = await generateAIResponse(transcription);
        
        if (aiResponse) {
          await sendAudioResponse(aiResponse);
        }
      }
      
    } catch (error) {
      console.error(`❌ Erro processando áudio:`, error);
    } finally {
      isProcessingAudio = false;
    }
  }

  // Eventos WebSocket
  socket.onopen = () => {
    console.log(`✅ WebSocket conectado para call ${callSid}`);
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      console.log(`📨 Evento recebido:`, data.event);
      
      switch (data.event) {
        case "connected":
          console.log(`🔗 Media Stream conectado`);
          break;
          
        case "start":
          streamSid = data.start?.streamSid;
          console.log(`▶️ Stream iniciado: ${streamSid}`);
          
          // Enviar saudação inicial após delay pequeno
          setTimeout(async () => {
            if (!hasGreeted) {
              hasGreeted = true;
              const welcomeText = "Olá! Aqui é a Laura da Voxemy. Como posso ajudar você hoje?";
              await sendAudioResponse(welcomeText);
            }
          }, 1000);
          break;
          
        case "media":
          if (data.media?.payload && streamSid) {
            // Decodificar áudio
            const audioData = Uint8Array.from(atob(data.media.payload), c => c.charCodeAt(0));
            audioBuffer.push(audioData);
            lastSpeechTime = Date.now();
            
            // Processar após silêncio de 2 segundos
            setTimeout(async () => {
              if (Date.now() - lastSpeechTime >= 2000) {
                await processAudioBuffer();
              }
            }, 2000);
          }
          break;
          
        case "stop":
          console.log(`⏹️ Stream finalizado: ${streamSid}`);
          await saveConversationLog("conversation_ended", {
            total_messages: conversationHistory.length,
            final_history: conversationHistory
          });
          break;
      }
    } catch (error) {
      console.error(`❌ Erro processando evento:`, error);
    }
  };

  socket.onclose = () => {
    console.log(`🔌 WebSocket desconectado para call ${callSid}`);
  };

  socket.onerror = (error) => {
    console.error(`💥 Erro WebSocket:`, error);
  };

  return response;
});

console.log("🚀 Servidor WebSocket ConversationRelay pronto");
