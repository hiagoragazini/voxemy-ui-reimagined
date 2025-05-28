
// Servidor WebSocket dedicado para Twilio ConversationRelay
// Template completo para implantação em Railway/Render

require('dotenv').config();
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');

// Configuração do servidor
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 8080;
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Função para log detalhado
function logEvent(type, data) {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${type}:`, JSON.stringify(data, null, 2));
}

// Sistema de prompt para IA
const systemPrompt = `Você é Laura, assistente virtual brasileira da Voxemy para atendimento telefônico.

INSTRUÇÕES CRÍTICAS:
- Seja natural, amigável e concisa (máximo 2 frases)
- Use português brasileiro coloquial para telefone
- Processe o que o cliente disse e responda adequadamente
- Se não entender, peça para repetir educadamente
- Mantenha a conversa fluindo naturalmente

Esta é uma conversa telefônica ao vivo em tempo real.`;

// Função para gerar resposta da IA
async function generateAIResponse(userText, conversationHistory = []) {
  if (!OPENAI_API_KEY) {
    return "Desculpe, estou com problemas técnicos no momento.";
  }

  try {
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-6),
        { role: 'user', content: userText }
      ],
      max_tokens: 100,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    return response.data.choices[0]?.message?.content?.trim() || 
           "Desculpe, não entendi bem. Pode repetir?";
  } catch (error) {
    logEvent('AI_ERROR', { error: error.message });
    return "Desculpe, não entendi bem. Pode repetir?";
  }
}

// Gerenciar conexões WebSocket
wss.on('connection', (ws, req) => {
  const url = new URL('http://localhost' + req.url);
  const callSid = url.searchParams.get('callSid');
  
  logEvent('CONNECTION', { callSid, url: req.url });
  
  let conversationHistory = [];
  let hasGreeted = false;
  
  // Heartbeat para manter conexão ativa
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.ping();
      logEvent('HEARTBEAT', { callSid });
    }
  }, 25000);
  
  ws.on('message', async (message) => {
    try {
      const msg = JSON.parse(message);
      logEvent('RECEIVED', { callSid, event: msg.event, data: msg });
      
      switch (msg.event) {
        case 'connected':
          logEvent('HANDSHAKE', { callSid });
          const response = { event: 'connected' };
          ws.send(JSON.stringify(response));
          logEvent('SENT', { callSid, response });
          break;
          
        case 'start':
          logEvent('CALL_START', { callSid });
          if (!hasGreeted) {
            hasGreeted = true;
            const greeting = {
              event: 'speak',
              text: 'Olá! Aqui é a Laura da Voxemy. Como posso ajudar você hoje?',
              config: {
                provider: ELEVENLABS_API_KEY ? 'elevenlabs' : 'twilio',
                voice_id: 'FGY2WhTYpPnrIDTdsKH5',
                stability: 0.35,
                similarity: 0.75,
                style: 0.4,
                speed: 0.95,
                audio_format: 'ulaw_8000'
              }
            };
            
            if (!ELEVENLABS_API_KEY) {
              delete greeting.config.provider;
              delete greeting.config.voice_id;
              delete greeting.config.stability;
              delete greeting.config.similarity;
              delete greeting.config.style;
              delete greeting.config.speed;
            }
            
            ws.send(JSON.stringify(greeting));
            logEvent('SENT', { callSid, greeting });
          }
          break;
          
        case 'media':
          logEvent('MEDIA', { callSid, length: msg.media?.length || 0 });
          break;
          
        case 'transcript':
          if (msg.transcript?.speech) {
            const userSpeech = msg.transcript.speech.trim();
            logEvent('TRANSCRIPT', { callSid, speech: userSpeech });
            
            if (userSpeech.length > 2) {
              conversationHistory.push({ role: 'user', content: userSpeech });
              
              const aiResponse = await generateAIResponse(userSpeech, conversationHistory);
              
              if (aiResponse) {
                conversationHistory.push({ role: 'assistant', content: aiResponse });
                
                const speakEvent = {
                  event: 'speak',
                  text: aiResponse,
                  config: {
                    provider: ELEVENLABS_API_KEY ? 'elevenlabs' : 'twilio',
                    voice_id: 'FGY2WhTYpPnrIDTdsKH5',
                    stability: 0.35,
                    similarity: 0.75,
                    style: 0.4,
                    speed: 0.95,
                    audio_format: 'ulaw_8000'
                  }
                };
                
                if (!ELEVENLABS_API_KEY) {
                  delete speakEvent.config.provider;
                  delete speakEvent.config.voice_id;
                  delete speakEvent.config.stability;
                  delete speakEvent.config.similarity;
                  delete speakEvent.config.style;
                  delete speakEvent.config.speed;
                }
                
                ws.send(JSON.stringify(speakEvent));
                logEvent('SENT', { callSid, speakEvent });
              }
            }
          }
          break;
          
        case 'mark':
          logEvent('MARK', { callSid, mark: msg.mark });
          break;
          
        case 'stop':
          logEvent('CALL_END', { callSid, reason: msg.reason });
          clearInterval(heartbeatInterval);
          ws.close();
          break;
          
        default:
          logEvent('UNKNOWN_EVENT', { callSid, event: msg.event, data: msg });
          break;
      }
    } catch (error) {
      logEvent('MESSAGE_ERROR', { callSid, error: error.message, raw: message.toString() });
    }
  });
  
  ws.on('close', () => {
    logEvent('CLOSE', { callSid });
    clearInterval(heartbeatInterval);
  });
  
  ws.on('error', (error) => {
    logEvent('ERROR', { callSid, error: error.message });
    clearInterval(heartbeatInterval);
  });
  
  ws.on('pong', () => {
    logEvent('PONG', { callSid });
  });
});

// Rotas HTTP para monitoramento
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connections: wss.clients.size,
    port: PORT
  });
});

app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    connections: wss.clients.size,
    elevenlabs: !!ELEVENLABS_API_KEY,
    openai: !!OPENAI_API_KEY,
    timestamp: new Date().toISOString()
  });
});

// Iniciar o servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor WebSocket Voxemy iniciado na porta ${PORT}`);
  console.log(`📊 APIs: OpenAI=${!!OPENAI_API_KEY}, ElevenLabs=${!!ELEVENLABS_API_KEY}`);
  console.log(`🌐 Endpoints: /health, /status`);
  console.log(`🔌 WebSocket pronto para Twilio ConversationRelay`);
});
