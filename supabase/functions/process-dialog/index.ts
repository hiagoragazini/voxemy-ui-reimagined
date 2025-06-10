
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para processar texto com OpenAI
async function processWithAI(text, conversationHistory = []) {
  const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!openAIApiKey) {
    console.error("[ERROR] process-dialog: OPENAI_API_KEY não configurada");
    return "Desculpe, estou com problemas técnicos no momento. Como posso ajudar de outra forma?";
  }

  try {
    console.log(`[DEBUG] process-dialog: Processando texto com IA: "${text}"`);
    console.log(`[DEBUG] process-dialog: Histórico tem ${conversationHistory.length} entradas`);
    
    // Preparar mensagens para o modelo
    const systemPrompt = {
      role: "system",
      content: `Você é um assistente virtual de atendimento telefônico da Voxemy.
      Seja cordial, profissional e objetivo nas suas respostas.
      Suas respostas devem ser naturais para conversação por voz, evitando textos muito longos.
      Limite suas respostas a no máximo 3 frases curtas.
      Fale em português brasileiro de forma natural.
      Se o cliente quiser encerrar a conversa, agradeça e se despeça educadamente.`,
    };
    
    // Formatar histórico de conversas para o modelo
    const messages = [
      systemPrompt,
      ...conversationHistory.slice(-6), // Apenas últimas 6 mensagens para evitar contexto muito longo
      { role: "user", content: text }
    ];
    
    console.log(`[DEBUG] process-dialog: Enviando para OpenAI com ${messages.length} mensagens`);
    
    // Fazer a chamada para a API com timeout adequado
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini", // Modelo mais rápido e econômico
        messages,
        max_tokens: 150,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ERROR] process-dialog: OpenAI API erro ${response.status}: ${errorText}`);
      throw new Error(`OpenAI API error: ${response.status}`);
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      throw new Error("Resposta vazia da OpenAI");
    }
    
    console.log(`[DEBUG] process-dialog: Resposta da IA: "${aiResponse}"`);
    return aiResponse;
    
  } catch (error) {
    console.error(`[ERROR] process-dialog: Erro ao processar com IA:`, error);
    return "Desculpe, estou tendo dificuldades para processar sua mensagem. Poderia repetir de outra forma?";
  }
}

// Função para salvar histórico de conversa
async function saveConversationHistory(supabase, callSid, messages, status = "active") {
  try {
    console.log(`[DEBUG] process-dialog: Salvando histórico para call ${callSid}, status: ${status}`);
    console.log(`[DEBUG] process-dialog: Total de mensagens: ${messages.length}`);
    
    // Verificar se já existe um registro para essa chamada
    const { data, error } = await supabase
      .from("call_logs")
      .select("id, call_sid, transcription")
      .eq("call_sid", callSid)
      .maybeSingle();
    
    if (error) {
      console.error("[ERROR] process-dialog: Erro ao consultar call_logs:", error);
      throw error;
    }
    
    // Se não existir, criar um novo registro
    if (!data) {
      console.log("[DEBUG] process-dialog: Criando novo registro");
      await supabase.from("call_logs").insert({
        call_sid: callSid,
        status: status,
        transcription: messages,
      });
    } else {
      // Se existir, atualizar o registro
      console.log(`[DEBUG] process-dialog: Atualizando registro existente: ${data.id}`);
      await supabase.from("call_logs").update({
        status: status,
        transcription: messages,
        updated_at: new Date().toISOString()
      }).eq("call_sid", callSid);
    }
    
    return true;
  } catch (error) {
    console.error("[ERROR] process-dialog: Erro ao salvar histórico:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("\n=== PROCESS-DIALOG HANDLER ===");
    console.log(`[DEBUG] process-dialog: Timestamp: ${new Date().toISOString()}`);
    console.log(`[DEBUG] process-dialog: Method: ${req.method}`);
    console.log(`[DEBUG] process-dialog: URL: ${req.url}`);
    
    // Parse content type to handle different request formats
    const contentType = req.headers.get("Content-Type") || "";
    console.log(`[DEBUG] process-dialog: Content-Type: ${contentType}`);
    
    let requestData = {};
    
    try {
      if (contentType.includes("application/json")) {
        requestData = await req.json();
        console.log("[DEBUG] process-dialog: Dados parseados como JSON");
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        // Handle form data from Twilio
        const formData = await req.formData();
        requestData = Object.fromEntries(formData.entries());
        console.log("[DEBUG] process-dialog: Dados parseados como form data");
        console.log(`[DEBUG] process-dialog: Form data keys: ${Object.keys(requestData).join(', ')}`);
      } else {
        // Try to parse as text and then form data
        const text = await req.text();
        console.log(`[DEBUG] process-dialog: Texto recebido: ${text.substring(0, 200)}...`);
        
        if (text.includes('=')) {
          // Parse as URL encoded
          const params = new URLSearchParams(text);
          requestData = Object.fromEntries(params.entries());
          console.log("[DEBUG] process-dialog: Parseado como URL encoded");
        } else {
          requestData = {};
          console.log("[DEBUG] process-dialog: Não foi possível parsear os dados");
        }
      }
    } catch (parseError) {
      console.error(`[ERROR] process-dialog: Erro ao parsear request:`, parseError);
      requestData = {};
    }
    
    console.log(`[DEBUG] process-dialog: Request data keys: ${Object.keys(requestData).join(', ')}`);
    
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[ERROR] process-dialog: Credenciais Supabase não configuradas");
      throw new Error("Credenciais Supabase não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract core data - handle both Twilio webhook format and our custom format
    const callSid = requestData.CallSid || requestData.callSid;
    const speechResult = requestData.SpeechResult || requestData.speechResult || "";
    const messages = requestData.messages || [];
    const endCall = requestData.endCall || false;
    
    // Log relevant data
    console.log(`[DEBUG] process-dialog: Call SID: ${callSid}`);
    console.log(`[DEBUG] process-dialog: Speech Result: "${speechResult}"`);
    console.log(`[DEBUG] process-dialog: Message Count: ${messages.length}`);
    console.log(`[DEBUG] process-dialog: End Call Flag: ${endCall}`);
    
    // Validate the data
    if (!callSid) {
      console.error("[ERROR] process-dialog: Missing CallSid");
      throw new Error("ID da chamada (callSid) não fornecido");
    }

    // Prepare TwiML response
    let twimlResponse;
    
    // Helper function to check if the message indicates an end to the conversation
    function isEndingConversation(message) {
      const lowerMessage = message.toLowerCase();
      const endPhrases = ["tchau", "adeus", "até logo", "encerrar", "desligar", "finalizar", "obrigado", "valeu"];
      return endPhrases.some(phrase => lowerMessage.includes(phrase));
    }
    
    // If end call flag is set or if we received an end call message
    if (endCall || (speechResult && isEndingConversation(speechResult))) {
      console.log("[DEBUG] process-dialog: Processando encerramento da chamada");
      // Mensagem de despedida
      const goodbyeMessage = "Obrigado pelo contato! Espero ter ajudado. Tenha um ótimo dia!";
      
      // Add farewell message to history
      const updatedMessages = [...messages, {
        role: "assistant",
        content: goodbyeMessage,
        timestamp: new Date().toISOString()
      }];
      
      // Save to Supabase
      await saveConversationHistory(supabase, callSid, updatedMessages, "completed");
      
      // Generate TwiML with simple Say element - more reliable than audio
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="woman" language="pt-BR">${goodbyeMessage}</Say>
        <Hangup/>
      </Response>`;
    } 
    // Normal dialog processing
    else if (speechResult) {
      console.log("[DEBUG] process-dialog: Processando diálogo normal");
      
      // Add user message to history
      const updatedMessages = [...messages, {
        role: "user",
        content: speechResult,
        timestamp: new Date().toISOString()
      }];
      
      // Process with AI
      const aiResponse = await processWithAI(
        speechResult, 
        updatedMessages.map(m => ({ role: m.role, content: m.content }))
      );
      
      // Add AI response to history
      updatedMessages.push({
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString()
      });
      
      // Save to Supabase
      await saveConversationHistory(supabase, callSid, updatedMessages);
      
      // Get the current domain from the request
      const requestUrl = new URL(req.url);
      const currentDomain = requestUrl.hostname;
      const protocol = requestUrl.protocol;
      
      // Simple TwiML with Say element - most reliable approach
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="woman" language="pt-BR">${aiResponse}</Say>
        <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="5" action="${protocol}//${currentDomain}/functions/v1/process-dialog" method="POST">
        </Gather>
        <Say voice="woman" language="pt-BR">Não ouvi nada. Vou encerrar a chamada.</Say>
        <Hangup/>
      </Response>`;
    }
    // Initial welcome message
    else {
      console.log("[DEBUG] process-dialog: Processando mensagem inicial");
      // Default welcome message
      const welcomeMessage = "Olá, aqui é da Voxemy. Como posso ajudar você hoje?";
      
      // Initialize conversation history
      const initialMessages = [{
        role: "assistant",
        content: welcomeMessage,
        timestamp: new Date().toISOString()
      }];
      
      // Save to Supabase
      await saveConversationHistory(supabase, callSid, initialMessages);
      
      // Get the current domain from the request
      const requestUrl = new URL(req.url);
      const currentDomain = requestUrl.hostname;
      const protocol = requestUrl.protocol;
      
      // Simple TwiML
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="woman" language="pt-BR">${welcomeMessage}</Say>
        <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="5" action="${protocol}//${currentDomain}/functions/v1/process-dialog" method="POST">
        </Gather>
        <Say voice="woman" language="pt-BR">Não ouvi nada. Vou encerrar a chamada.</Say>
        <Hangup/>
      </Response>`;
    }
    
    // Return TwiML response with proper content type
    console.log("[DEBUG] process-dialog: Enviando resposta TwiML");
    console.log(`[DEBUG] process-dialog: TwiML: ${twimlResponse.substring(0, 200)}...`);
    
    return new Response(twimlResponse, {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });

  } catch (error) {
    console.error("[ERROR] process-dialog: Erro na função:", error);
    
    // TwiML de erro simplificado
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="woman" language="pt-BR">Desculpe, ocorreu um erro no sistema. Vou encerrar a chamada.</Say>
      <Hangup/>
    </Response>`;
    
    return new Response(errorTwiml, {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
      status: 200 // Always return 200 to Twilio
    });
  }
});
