
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

// Token de acesso da API Zenvia
const ZENVIA_API_TOKEN = Deno.env.get("ZENVIA_API_TOKEN") || "59db3a357f71882854f0bb309aa36c2b";

// Função para processar texto com OpenAI
async function processWithAI(text) {
  try {
    // Inicializar o módulo OpenAI
    const { default: OpenAI } = await import("npm:openai@4.20.0");
    
    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });
    
    console.log(`Processando texto com OpenAI: "${text}"`);
    
    // Preparar mensagens para o modelo
    const systemPrompt = {
      role: "system",
      content: `Você é um assistente virtual de atendimento telefônico.
      Seja cordial, profissional e objetivo nas suas respostas.
      Suas respostas devem ser naturais para conversação por voz, evitando textos muito longos.
      Limite suas respostas a no máximo 3 frases curtas.
      Fale em português brasileiro de forma natural.
      Se o cliente quiser encerrar a conversa, agradeça e se despeça educadamente.`,
    };
    
    // Fazer a chamada para a API com timeout adequado
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modelo mais rápido e econômico
      messages: [
        systemPrompt,
        { role: "user", content: text }
      ],
      max_tokens: 150,
      temperature: 0.7,
    });
    
    const aiResponse = response.choices[0].message.content.trim();
    console.log(`AI Response: "${aiResponse}"`);
    return aiResponse;
  } catch (error) {
    console.error("Erro ao processar texto com AI:", error);
    return "Desculpe, estou tendo dificuldades para processar sua mensagem. Poderia repetir de outra forma?";
  }
}

// Função para responder via API da Zenvia
async function sendZenviaReply(sessionId, messageText) {
  try {
    // Endpoint para responder a uma mensagem na Zenvia
    const zenviaApiUrl = "https://api.zenvia.com/v2/channels/voice/messages";
    
    // Payload para resposta
    const payload = {
      from: Deno.env.get("ZENVIA_FROM_NUMBER") || "zenvia-voice",
      to: sessionId, // O ID da sessão como identificador
      contents: [
        {
          type: "text",
          text: messageText
        }
      ]
    };
    
    // Configurar cabeçalhos com autenticação
    const headers = {
      "Content-Type": "application/json",
      "X-API-Token": ZENVIA_API_TOKEN
    };
    
    // Enviar resposta para a Zenvia
    const response = await fetch(zenviaApiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ao enviar resposta: ${response.status} - ${errorText}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Erro ao enviar resposta Zenvia:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("\n=== ZENVIA-PROCESS-DIALOG HANDLER ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);

    // Extrair dados da requisição
    const requestData = await req.json().catch(() => ({}));
    console.log("Request data:", JSON.stringify(requestData, null, 2));
    
    // Inicializar cliente do Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Credenciais Supabase não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Extrair mensagem do usuário baseado na estrutura da Zenvia
    // A estrutura exata pode variar conforme a documentação da Zenvia
    const userMessage = extractUserMessage(requestData);
    const sessionId = extractSessionId(requestData);
    
    console.log(`Mensagem do usuário: "${userMessage}"`);
    console.log(`ID da sessão: ${sessionId}`);
    
    if (!userMessage) {
      throw new Error("Não foi possível extrair a mensagem do usuário");
    }
    
    // Processar a mensagem com IA
    const aiResponse = await processWithAI(userMessage);
    
    // Armazenar a conversa no Supabase (opcional)
    if (sessionId) {
      try {
        await supabase.from('call_logs').insert({
          call_sid: sessionId,
          status: 'active',
          transcription: [
            { role: 'user', content: userMessage },
            { role: 'assistant', content: aiResponse }
          ]
        });
      } catch (dbError) {
        console.error("Erro ao salvar conversa:", dbError);
        // Continuar mesmo em caso de erro no banco de dados
      }
    }
    
    // Se tivermos ID de sessão, enviar resposta via API
    let apiResponse = null;
    if (sessionId) {
      try {
        apiResponse = await sendZenviaReply(sessionId, aiResponse);
      } catch (replyError) {
        console.error("Erro ao enviar resposta:", replyError);
        // Continuar e retornar resposta via webhook de volta
      }
    }
    
    // Retornar resposta em formato JSON para o webhook da Zenvia
    return new Response(
      JSON.stringify({
        success: true,
        sessionId: sessionId,
        userMessage: userMessage,
        aiResponse: aiResponse,
        apiResponse: apiResponse,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Erro no processamento do diálogo Zenvia:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro desconhecido no processamento de diálogo",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

// Helpers para extrair dados do webhook da Zenvia (ajustar conforme documentação)
function extractUserMessage(data) {
  // Tentar vários caminhos possíveis para extrair a mensagem do usuário
  return data.message?.contents?.[0]?.text ||
         data.contents?.[0]?.text ||
         data.text ||
         data.input ||
         data.userMessage ||
         data.speechResult ||
         '';
}

function extractSessionId(data) {
  // Tentar vários caminhos possíveis para extrair o ID da sessão
  return data.message?.id ||
         data.id ||
         data.sessionId ||
         data.callId ||
         data.messageId ||
         `session-${Date.now()}`;
}
