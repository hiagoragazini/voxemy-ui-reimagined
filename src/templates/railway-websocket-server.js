
// Servidor WebSocket ConversationRelay para Railway - PROTOCOLO COMPLETO
// Deploy direto no Railway com suporte completo ao protocolo Twilio

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');

// Configuração
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = process.env.PORT || 8080;

// Variáveis de ambiente necessárias
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

console.log('🚀 Servidor ConversationRelay Railway - PROTOCOLO COMPLETO IMPLEMENTADO');
console.log(`🔑 OpenAI: ${!!OPENAI_API_KEY}, Supabase: ${!!SUPABASE_URL}`);

// Sistema de prompt otimizado para telefonia brasileira
const SYSTEM_PROMPT = `Você é Laura, assistente virtual brasileira da Voxemy para atendimento telefônico.

INSTRUÇÕES CRÍTICAS:
- Seja natural, amigável e concisa (máximo 2 frases por resposta)
- Use português brasileiro coloquial apropriado para telefone
- Processe completamente o que o cliente disse antes de responder
- Se não entender claramente, peça para repetir educadamente
- Mantenha conversa fluindo naturalmente
- Evite repetições desnecessárias
- Foque em ajudar o cliente de forma prática

Esta é uma conversa telefônica ao vivo em tempo real.`;

// Função para gerar resposta da IA
async function generateAIResponse(userText, conversationHistory = [], callSid = null) {
  if (!OPENAI_API_KEY) {
    console.error(`❌ [${callSid}] OpenAI API key não configurada`);
    return "Desculpe, estou com problemas técnicos no momento.";
  }

  try {
    console.log(`🤖 [${callSid}] Gerando resposta para: "${userText}"`);
    
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...conversationHistory.slice(-6), // Últimas 6 mensagens para contexto
        { role: 'user', content: userText }
      ],
      max_tokens: 100, // Respostas concisas para telefone
      temperature: 0.7,
      presence_penalty: 0.3,
      frequency_penalty: 0.3
    }, {
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000 // 8 segundos timeout
    });

    const aiResponse = response.data.choices[0]?.message?.content?.trim();
    
    if (aiResponse) {
      console.log(`✅ [${callSid}] Resposta IA: "${aiResponse}"`);
      return aiResponse;
    } else {
      console.error(`❌ [${callSid}] Resposta vazia da OpenAI`);
      return "Desculpe, não entendi bem. Pode repetir?";
    }
  } catch (error) {
    console.error(`❌ [${callSid}] Erro OpenAI:`, error.message);
    return "Desculpe, não consegui processar sua mensagem. Pode tentar novamente?";
  }
}

// Função para salvar logs no Supabase
async function saveConversationLog(callSid, event, data) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !callSid) return;

  try {
    const logData = {
      event,
      data,
      timestamp: new Date().toISOString(),
      server: 'railway_dedicated'
    };

    await axios.patch(`${SUPABASE_URL}/rest/v1/call_logs`, {
      conversation_log: JSON.stringify(logData),
      status: event === 'call_ended' ? 'completed' : 'conversation_active'
    }, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'resolution=merge-duplicates'
      },
      params: {
        call_sid: `eq.${callSid}`
      }
    });

    console.log(`📝 [${callSid}] Log salvo: ${event}`);
  } catch (error) {
    console.error(`❌ [${callSid}] Erro salvando log:`, error.message);
  }
}

// Gerenciar conexões WebSocket com protocolo ConversationRelay COMPLETO
wss.on('connection', (ws, req) => {
  // Extrair parâmetros da URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const callSid = url.searchParams.get('callSid') || `CALL_${Date.now()}`;
  const agentId = url.searchParams.get('agentId');
  const campaignId = url.searchParams.get('campaignId');
  const leadId = url.searchParams.get('leadId');
  
  console.log(`🔌 [${callSid}] Nova conexão WebSocket - Railway ConversationRelay`);
  console.log(`📋 [${callSid}] Params: Agent=${agentId}, Campaign=${campaignId}, Lead=${leadId}`);
  
  // Estado da conexão
  let conversationHistory = [];
  let hasGreeted = false;
  let isConnected = false;
  let streamSid = null;
  let lastTranscript = "";
  let silenceTimer = null;
  
  // Heartbeat para manter conexão ativa
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.ping();
      } catch (error) {
        console.error(`❌ [${callSid}] Erro heartbeat:`, error.message);
        clearInterval(heartbeatInterval);
      }
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 25000);
  
  // Função para enviar mensagem de voz usando ConversationRelay
  function sendVoiceMessage(text) {
    if (ws.readyState !== WebSocket.OPEN || !streamSid) {
      console.error(`❌ [${callSid}] WebSocket não está pronto para enviar voz`);
      return;
    }

    console.log(`🎙️ [${callSid}] Enviando voz: "${text}"`);
    
    const messageEvent = {
      event: 'message',
      streamSid: streamSid,
      text: text,
      voice: 'Polly.Camila-Neural' // Voz brasileira do Polly
    };
    
    try {
      ws.send(JSON.stringify(messageEvent));
      console.log(`✅ [${callSid}] Mensagem de voz enviada`);
      
      // Salvar no Supabase
      saveConversationLog(callSid, 'ai_voice_sent', { text, voice: 'Polly.Camila-Neural' });
    } catch (error) {
      console.error(`❌ [${callSid}] Erro enviando voz:`, error.message);
    }
  }
  
  // Função para processar transcrição e gerar resposta
  async function processTranscript(transcript, confidence) {
    if (transcript.length < 3 || transcript === lastTranscript || confidence < 0.7) {
      return;
    }
    
    lastTranscript = transcript;
    console.log(`💬 [${callSid}] Processando: "${transcript}" (conf: ${confidence})`);
    
    // Adicionar à história da conversa
    conversationHistory.push({
      role: 'user',
      content: transcript,
      timestamp: new Date().toISOString(),
      confidence: confidence
    });
    
    // Salvar fala do usuário
    await saveConversationLog(callSid, 'user_speech', { text: transcript, confidence });
    
    // Gerar resposta da IA
    const aiResponse = await generateAIResponse(transcript, conversationHistory, callSid);
    
    if (aiResponse) {
      // Adicionar resposta à história
      conversationHistory.push({
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      });
      
      // Enviar resposta por voz
      sendVoiceMessage(aiResponse);
    }
  }
  
  // Eventos WebSocket - PROTOCOLO CONVERSATIONRELAY COMPLETO
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`📨 [${callSid}] Evento recebido: ${data.event}`);
      
      switch (data.event) {
        case 'connected':
          console.log(`🤝 [${callSid}] ConversationRelay conectado`);
          isConnected = true;
          await saveConversationLog(callSid, 'connected', data);
          break;
          
        case 'start':
          streamSid = data.start?.streamSid;
          console.log(`🚀 [${callSid}] Stream iniciado: ${streamSid}`);
          
          if (!hasGreeted && streamSid) {
            hasGreeted = true;
            setTimeout(() => {
              sendVoiceMessage('Olá! Aqui é a Laura da Voxemy. Como posso ajudar você hoje?');
            }, 1000); // Aguardar 1 segundo antes da saudação
          }
          
          await saveConversationLog(callSid, 'stream_started', { streamSid });
          break;
          
        case 'media':
          // Log apenas amostra dos pacotes de media
          if (Math.random() < 0.01) { // 1% dos pacotes
            console.log(`🎤 [${callSid}] Media packet recebido`);
          }
          break;
          
        case 'transcript':
          if (data.transcript?.text) {
            const transcript = data.transcript.text.trim();
            const confidence = data.transcript.confidence || 0;
            const isFinal = data.transcript.is_final;
            
            console.log(`📝 [${callSid}] Transcrição: "${transcript}" (final: ${isFinal}, conf: ${confidence})`);
            
            // Processar apenas transcrições finais
            if (isFinal) {
              await processTranscript(transcript, confidence);
            }
          }
          break;
          
        case 'mark':
          console.log(`🔖 [${callSid}] Mark: ${data.mark?.name}`);
          break;
          
        case 'stop':
          console.log(`🛑 [${callSid}] Stream parado`);
          await saveConversationLog(callSid, 'call_ended', {
            total_messages: conversationHistory.length,
            final_history: conversationHistory
          });
          
          clearInterval(heartbeatInterval);
          if (silenceTimer) clearTimeout(silenceTimer);
          break;
          
        default:
          console.log(`❓ [${callSid}] Evento desconhecido: ${data.event}`);
          break;
      }
    } catch (error) {
      console.error(`❌ [${callSid}] Erro processando mensagem:`, error.message);
      console.error(`Raw message:`, message.toString().substring(0, 200));
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 [${callSid}] Conexão fechada - Code: ${code}, Reason: ${reason?.toString()}`);
    clearInterval(heartbeatInterval);
    if (silenceTimer) clearTimeout(silenceTimer);
  });
  
  ws.on('error', (error) => {
    console.error(`💥 [${callSid}] Erro WebSocket:`, error.message);
    clearInterval(heartbeatInterval);
  });
  
  ws.on('pong', () => {
    console.log(`🏓 [${callSid}] Pong recebido`);
  });
});

// Rotas HTTP para monitoramento
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    connections: wss.clients.size,
    timestamp: new Date().toISOString(),
    port: PORT,
    protocol: 'ConversationRelay_Complete',
    server: 'Railway_Dedicated',
    version: '3.0_RAILWAY_COMPLETE',
    apis: {
      openai: !!OPENAI_API_KEY,
      supabase: !!SUPABASE_URL
    },
    features: {
      conversation_relay: true,
      voice_synthesis: true,
      speech_recognition: true,
      ai_responses: !!OPENAI_API_KEY,
      portuguese_support: true
    }
  });
});

app.get('/status', (req, res) => {
  res.json({
    status: 'running',
    connections: wss.clients.size,
    protocol: 'ConversationRelay_Complete',
    voice: 'Polly.Camila-Neural',
    language: 'pt-BR',
    server: 'Railway_Dedicated',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

app.get('/debug', (req, res) => {
  const connections = [];
  wss.clients.forEach((client, index) => {
    connections.push({
      index,
      readyState: client.readyState,
      protocol: client.protocol
    });
  });
  
  res.json({
    connections,
    totalConnections: wss.clients.size,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: PORT,
      OPENAI_API_KEY: !!OPENAI_API_KEY,
      SUPABASE_URL: !!SUPABASE_URL
    }
  });
});

// Middleware para logs
app.use((req, res, next) => {
  console.log(`🌐 HTTP ${req.method} ${req.url} - ${req.headers['user-agent']}`);
  next();
});

// Iniciar servidor
server.listen(PORT, () => {
  console.log(`🚀 Servidor ConversationRelay Railway iniciado na porta ${PORT}`);
  console.log(`🎯 Protocolo: ConversationRelay COMPLETO`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`🌐 Endpoints: /health, /status, /debug`);
  console.log(`🎙️ Voz: Polly.Camila-Neural (pt-BR)`);
  console.log(`🤖 IA: ${OPENAI_API_KEY ? 'HABILITADA' : 'DESABILITADA'}`);
  console.log(`✅ Pronto para receber conexões do Twilio ConversationRelay`);
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
