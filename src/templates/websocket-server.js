
// Servidor WebSocket dedicado para Twilio ConversationRelay - VERSÃO CORRIGIDA
// Template completo para implantação em Railway/Render - PROTOCOLO COMPLETO

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
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log(`🚀 Servidor WebSocket ConversationRelay - VERSÃO CORRIGIDA - PROTOCOLO COMPLETO`);
console.log(`📊 APIs: OpenAI=${!!OPENAI_API_KEY}, Supabase=${!!SUPABASE_URL}`);
console.log(`🎤 Usando APENAS vozes nativas brasileiras do ConversationRelay`);

// Função para log detalhado com timestamp
function logEvent(type, data, callSid = null) {
  const timestamp = new Date().toISOString();
  const prefix = callSid ? `[${callSid}]` : '[SYSTEM]';
  console.log(`${timestamp} ${prefix} ${type}:`, JSON.stringify(data, null, 2));
}

// Sistema de prompt otimizado para telefonia
const systemPrompt = `Você é Laura, assistente virtual brasileira da Voxemy para atendimento telefônico.

INSTRUÇÕES CRÍTICAS:
- Seja natural, amigável e concisa (máximo 2 frases por resposta)
- Use português brasileiro coloquial apropriado para telefone
- Processe completamente o que o cliente disse antes de responder
- Se não entender claramente, peça para repetir de forma educada
- Mantenha a conversa fluindo naturalmente
- Evite repetições desnecessárias
- Foque em ajudar o cliente de forma prática

Esta é uma conversa telefônica ao vivo em tempo real.`;

// Função para gerar resposta da IA otimizada
async function generateAIResponse(userText, conversationHistory = [], callSid = null) {
  if (!OPENAI_API_KEY) {
    logEvent('AI_ERROR', { error: 'OpenAI API key não configurada' }, callSid);
    return "Desculpe, estou com problemas técnicos no momento. Pode tentar novamente?";
  }

  try {
    logEvent('AI_REQUEST', { userText, historyLength: conversationHistory.length }, callSid);
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        ...conversationHistory.slice(-8), // Últimas 8 mensagens para contexto
        { role: 'user', content: userText }
      ],
      max_tokens: 120, // Respostas mais concisas para telefone
      temperature: 0.7,
      presence_penalty: 0.3, // Evitar repetições
      frequency_penalty: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000 // 10 segundos timeout
    });

    const aiResponse = response.data.choices[0]?.message?.content?.trim();
    
    if (aiResponse) {
      logEvent('AI_RESPONSE', { response: aiResponse, tokens: response.data.usage }, callSid);
      return aiResponse;
    } else {
      logEvent('AI_ERROR', { error: 'Resposta vazia da OpenAI' }, callSid);
      return "Desculpe, não entendi bem. Pode repetir?";
    }
  } catch (error) {
    logEvent('AI_ERROR', { 
      error: error.message, 
      status: error.response?.status,
      data: error.response?.data 
    }, callSid);
    return "Desculpe, não consegui processar sua mensagem. Pode tentar novamente?";
  }
}

// Função para salvar logs no Supabase
async function saveConversationLog(callSid, event, data) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !callSid) return;

  try {
    await axios.post(`${SUPABASE_URL}/rest/v1/call_logs`, {
      call_sid: callSid,
      conversation_log: JSON.stringify({
        event,
        data,
        timestamp: new Date().toISOString(),
        server: 'external_railway'
      }),
      status: 'conversation_active'
    }, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      }
    });
  } catch (error) {
    logEvent('SUPABASE_ERROR', { error: error.message }, callSid);
  }
}

// Gerenciar conexões WebSocket com protocolo ConversationRelay COMPLETO
wss.on('connection', (ws, req) => {
  // Extrair callSid e outros parâmetros da URL
  let callSid = null;
  let fullUrl = null;
  
  try {
    const host = req.headers.host || 'localhost:8080';
    fullUrl = new URL(req.url, `http://${host}`);
    callSid = fullUrl.searchParams.get('callSid');
    
    logEvent('CONNECTION_ATTEMPT', {
      url: req.url,
      host: req.headers.host,
      fullUrl: fullUrl.toString(),
      callSid: callSid,
      userAgent: req.headers['user-agent'],
      origin: req.headers.origin
    });
  } catch (urlError) {
    logEvent('URL_PARSE_ERROR', {
      error: urlError.message,
      originalUrl: req.url,
      headers: req.headers
    });
  }
  
  if (!callSid) {
    logEvent('WARNING_NO_CALLSID', {
      message: 'Conexão WebSocket sem callSid detectada',
      url: req.url,
      headers: req.headers,
      userAgent: req.headers['user-agent']
    });
    callSid = `UNKNOWN_${Date.now()}`;
  }
  
  const userAgent = req.headers['user-agent'] || '';
  const isTwilioAgent = userAgent.includes('TwilioProxy') || userAgent.includes('Twilio');
  
  if (!isTwilioAgent) {
    logEvent('WARNING_NON_TWILIO_CONNECTION', {
      callSid: callSid,
      userAgent: userAgent,
      message: 'Conexão pode não ser do Twilio'
    }, callSid);
  }
  
  logEvent('CONNECTION_ESTABLISHED', { 
    callSid: callSid,
    isTwilioAgent: isTwilioAgent,
    activeConnections: wss.clients.size,
    voiceMode: 'NATIVE_TWILIO_CORRECTED',
    server: 'RAILWAY_DEDICATED'
  }, callSid);
  
  // Estado da conexão
  let conversationHistory = [];
  let hasGreeted = false;
  let isConnected = false;
  let hasStarted = false;
  let lastTranscript = "";
  
  // Heartbeat para manter conexão ativa
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.ping();
        logEvent('HEARTBEAT_SENT', { status: 'ok' }, callSid);
      } catch (error) {
        logEvent('HEARTBEAT_ERROR', { error: error.message }, callSid);
        clearInterval(heartbeatInterval);
      }
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 25000);
  
  // Função para enviar speak event com vozes nativas
  function sendSpeakEvent(text) {
    if (ws.readyState !== WebSocket.OPEN) {
      logEvent('SPEAK_ERROR', { error: 'WebSocket not open', text }, callSid);
      return;
    }

    const speakEvent = {
      event: 'speak',
      text: text,
      config: {
        voice: 'pt-BR-FranciscaNeural', // Voz brasileira nativa
        rate: '0.95',
        pitch: 'medium',
        audio_format: 'ulaw_8000'
      }
    };
    
    try {
      ws.send(JSON.stringify(speakEvent));
      logEvent('SPEAK_SENT', { text, config: speakEvent.config }, callSid);
    } catch (error) {
      logEvent('SPEAK_ERROR', { error: error.message, text }, callSid);
    }
  }
  
  ws.on('message', async (message) => {
    try {
      const msg = JSON.parse(message);
      logEvent('MESSAGE_RECEIVED', { 
        event: msg.event, 
        hasData: !!msg.data,
        messageSize: message.length,
        timestamp: new Date().toISOString()
      }, callSid);
      
      // Salvar evento no Supabase
      await saveConversationLog(callSid, 'message_received', { event: msg.event, data: msg });
      
      switch (msg.event) {
        case 'connected':
          logEvent('HANDSHAKE_RECEIVED', { streamSid: msg.streamSid }, callSid);
          isConnected = true;
          
          // CRÍTICO: Responder imediatamente ao handshake
          const response = { event: 'connected' };
          ws.send(JSON.stringify(response));
          logEvent('HANDSHAKE_SENT', { response }, callSid);
          
          await saveConversationLog(callSid, 'handshake_completed', { success: true });
          break;
          
        case 'start':
          logEvent('CALL_START', { 
            streamSid: msg.start?.streamSid, 
            voiceMode: 'NATIVE_TWILIO_CORRECTED',
            server: 'RAILWAY_DEDICATED'
          }, callSid);
          hasStarted = true;
          
          if (!hasGreeted) {
            hasGreeted = true;
            sendSpeakEvent('Olá! Aqui é a Laura da Voxemy. Como posso ajudar você hoje?');
            
            conversationHistory.push({
              role: 'assistant',
              content: 'Olá! Aqui é a Laura da Voxemy. Como posso ajudar você hoje?',
              timestamp: new Date().toISOString()
            });
            
            await saveConversationLog(callSid, 'greeting_sent', { 
              text: 'Olá! Aqui é a Laura da Voxemy. Como posso ajudar você hoje?',
              voice: 'pt-BR-FranciscaNeural'
            });
          }
          break;
          
        case 'media':
          // Log apenas amostra dos pacotes de media para não poluir
          if (Math.random() < 0.01) { // ~1% dos pacotes
            logEvent('MEDIA_SAMPLE', { 
              mediaLength: msg.media?.length || 0,
              timestamp: msg.media?.timestamp,
              sequence: msg.media?.sequence
            }, callSid);
          }
          break;
          
        case 'transcript':
          if (msg.transcript?.speech) {
            const userSpeech = msg.transcript.speech.trim();
            const confidence = msg.transcript.confidence;
            const isFinal = msg.transcript.is_final;
            
            logEvent('TRANSCRIPT_RECEIVED', { 
              speech: userSpeech,
              confidence: confidence,
              isFinal: isFinal,
              length: userSpeech.length
            }, callSid);
            
            // Processar apenas transcrições finais e com confiança adequada
            if (isFinal && userSpeech.length > 2 && userSpeech !== lastTranscript && confidence > 0.7) {
              lastTranscript = userSpeech;
              
              conversationHistory.push({ 
                role: 'user', 
                content: userSpeech,
                timestamp: new Date().toISOString(),
                confidence: confidence
              });
              
              await saveConversationLog(callSid, 'user_speech', { 
                text: userSpeech, 
                confidence: confidence 
              });
              
              // Gerar resposta da IA
              const aiResponse = await generateAIResponse(userSpeech, conversationHistory, callSid);
              
              if (aiResponse) {
                conversationHistory.push({ 
                  role: 'assistant', 
                  content: aiResponse,
                  timestamp: new Date().toISOString()
                });
                
                sendSpeakEvent(aiResponse);
                
                await saveConversationLog(callSid, 'ai_response', { 
                  text: aiResponse,
                  voice: 'pt-BR-FranciscaNeural'
                });
              }
            }
          }
          break;
          
        case 'mark':
          logEvent('MARK_RECEIVED', { mark: msg.mark }, callSid);
          break;
          
        case 'stop':
          logEvent('CALL_END', { 
            reason: msg.reason,
            duration: conversationHistory.length,
            voiceUsed: 'NATIVE_TWILIO_CORRECTED',
            server: 'RAILWAY_DEDICATED'
          }, callSid);
          
          await saveConversationLog(callSid, 'call_ended', {
            reason: msg.reason,
            total_messages: conversationHistory.length,
            final_history: conversationHistory
          });
          
          clearInterval(heartbeatInterval);
          ws.close();
          break;
          
        default:
          logEvent('UNKNOWN_EVENT', { event: msg.event, data: msg }, callSid);
          break;
      }
    } catch (error) {
      logEvent('MESSAGE_PARSE_ERROR', { 
        error: error.message, 
        rawMessage: message.toString().substring(0, 200) + '...' 
      }, callSid);
    }
  });
  
  ws.on('close', (code, reason) => {
    logEvent('CONNECTION_CLOSED', { 
      code, 
      reason: reason?.toString(),
      activeConnections: wss.clients.size - 1,
      conversationLength: conversationHistory.length
    }, callSid);
    clearInterval(heartbeatInterval);
  });
  
  ws.on('error', (error) => {
    logEvent('WEBSOCKET_ERROR', { 
      error: error.message,
      stack: error.stack?.substring(0, 500)
    }, callSid);
    clearInterval(heartbeatInterval);
  });
  
  ws.on('pong', () => {
    logEvent('HEARTBEAT_PONG', { timestamp: new Date().toISOString() }, callSid);
  });
});

// Rotas HTTP para monitoramento e diagnóstico
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    connections: wss.clients.size,
    port: PORT,
    voiceMode: 'NATIVE_TWILIO_CORRECTED',
    server: 'RAILWAY_DEDICATED',
    version: '2.0_CORRIGIDO',
    apis: {
      openai: !!OPENAI_API_KEY,
      supabase: !!SUPABASE_URL,
      elevenlabs: false // Removido conforme orientação Twilio
    },
    features: {
      conversation_relay: true,
      native_voices: true,
      portuguese_support: true,
      realtime_transcription: true,
      ai_responses: !!OPENAI_API_KEY
    }
  });
});

app.get('/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    connections: wss.clients.size,
    voiceProvider: 'TWILIO_NATIVE_CORRECTED',
    protocol: 'CONVERSATION_RELAY_COMPLETE',
    language: 'pt-BR',
    voice: 'pt-BR-FranciscaNeural',
    openai: !!OPENAI_API_KEY,
    supabase: !!SUPABASE_URL,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    environment: process.env.NODE_ENV || 'production'
  });
});

app.get('/debug', (req, res) => {
  const connections = [];
  wss.clients.forEach((client, index) => {
    connections.push({
      index,
      readyState: client.readyState,
      protocol: client.protocol,
      url: client.url
    });
  });
  
  res.status(200).json({
    connections,
    totalConnections: wss.clients.size,
    timestamp: new Date().toISOString(),
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: PORT,
      OPENAI_API_KEY: !!OPENAI_API_KEY,
      SUPABASE_URL: !!SUPABASE_URL
    },
    websocketServer: {
      readyState: wss.readyState,
      clients: wss.clients.size
    }
  });
});

// Middleware para logs de requisições HTTP
app.use((req, res, next) => {
  logEvent('HTTP_REQUEST', {
    method: req.method,
    url: req.url,
    userAgent: req.headers['user-agent'],
    origin: req.headers.origin
  });
  next();
});

// Iniciar o servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor WebSocket Voxemy CORRIGIDO - PROTOCOLO COMPLETO - iniciado na porta ${PORT}`);
  console.log(`📊 APIs: OpenAI=${!!OPENAI_API_KEY}, Supabase=${!!SUPABASE_URL}, ElevenLabs=REMOVIDO`);
  console.log(`🌐 Endpoints: /health, /status, /debug`);
  console.log(`🔌 WebSocket pronto para Twilio ConversationRelay COMPLETO`);
  console.log(`🎤 Usando APENAS vozes nativas brasileiras do ConversationRelay`);
  console.log(`🔧 Versão: 2.0 CORRIGIDA - Protocolo ConversationRelay Completo`);
  console.log(`🚀 Servidor Railway dedicado com autenticação corrigida`);
  console.log(`✅ Pronto para receber chamadas do Twilio`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 Recebido SIGTERM, encerrando graciosamente...');
  server.close(() => {
    console.log('✅ Servidor encerrado graciosamente.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('🔄 Recebido SIGINT, encerrando graciosamente...');
  server.close(() => {
    console.log('✅ Servidor encerrado graciosamente.');
    process.exit(0);
  });
});
