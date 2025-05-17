
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para criar cliente do Twilio
async function getTwilioClient(accountSid, authToken) {
  const twilio = await import("npm:twilio@4.20.0");
  return new twilio.default(accountSid, authToken);
}

// Função para processar texto com OpenAI
async function processWithAI(text, conversationHistory = []) {
  try {
    // Inicializar o módulo OpenAI
    const { default: OpenAI } = await import("npm:openai@4.20.0");
    
    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY"),
    });
    
    // Detalhado logging para diagnóstico
    console.log(`=== PROCESS WITH AI ===`);
    console.log(`Input text: "${text}"`);
    console.log(`History entries: ${conversationHistory.length}`);
    
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
      ...conversationHistory,
      { role: "user", content: text }
    ];
    
    // Fazer a chamada para a API com timeout adequado
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modelo mais rápido e econômico
      messages,
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

// Função para salvar histórico de conversa
async function saveConversationHistory(supabase, callSid, messages, status = "active") {
  try {
    console.log(`Saving conversation history for call ${callSid}, status: ${status}`);
    console.log(`Message count: ${messages.length}`);
    
    // Verificar se já existe um registro para essa chamada
    const { data, error } = await supabase
      .from("call_logs")
      .select("id, call_sid, transcription")
      .eq("call_sid", callSid)
      .maybeSingle();
    
    if (error) {
      console.error("Error querying call_logs:", error);
      throw error;
    }
    
    // Se não existir, criar um novo registro
    if (!data) {
      console.log("No existing record, creating new one");
      await supabase.from("call_logs").insert({
        call_sid: callSid,
        status: status,
        transcription: messages,
      });
    } else {
      // Se existir, atualizar o registro
      console.log(`Updating existing record: ${data.id}`);
      await supabase.from("call_logs").update({
        status: status,
        transcription: messages,
        updated_at: new Date().toISOString()
      }).eq("call_sid", callSid);
    }
    
    return true;
  } catch (error) {
    console.error("Erro ao salvar histórico de conversa:", error);
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
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    
    // Parse content type to handle different request formats
    const contentType = req.headers.get("Content-Type") || "";
    console.log(`Content-Type: ${contentType}`);
    
    let requestData;
    if (contentType.includes("application/json")) {
      requestData = await req.json();
    } else if (contentType.includes("application/x-www-form-urlencoded") || 
               contentType.includes("multipart/form-data")) {
      // Handle form data from Twilio
      const formData = await req.formData();
      requestData = Object.fromEntries(formData.entries());
    } else {
      // Default to JSON parsing with fallback
      requestData = await req.json().catch(() => ({}));
    }
    
    console.log("Request data:", JSON.stringify(requestData).substring(0, 200) + "...");
    
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials not configured");
      throw new Error("Credenciais Supabase não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extract core data - handle both Twilio webhook format and our custom format
    const callSid = requestData.CallSid || requestData.callSid;
    const speechResult = requestData.SpeechResult || requestData.speechResult || "";
    const messages = requestData.messages || [];
    const endCall = requestData.endCall || false;
    
    // Log relevant data
    console.log(`Call SID: ${callSid}`);
    console.log(`Speech Result: "${speechResult}"`);
    console.log(`Message Count: ${messages.length}`);
    console.log(`End Call Flag: ${endCall}`);
    
    // Validate the data
    if (!callSid) {
      console.error("Missing CallSid");
      throw new Error("ID da chamada (callSid) não fornecido");
    }

    // Prepare TwiML response
    let twimlResponse;
    
    // If end call flag is set or if we received an end call message
    if (endCall || (speechResult && isEndingConversation(speechResult))) {
      console.log("Processing end call scenario");
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
      console.log("Processing normal dialog");
      
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
      
      // Simple TwiML with Say element - most reliable approach
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="woman" language="pt-BR">${aiResponse}</Say>
        <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="5" action="https://${Deno.env.get("SUPABASE_URL").split("https://")[1]}/functions/v1/process-dialog" method="POST">
        </Gather>
        <Say voice="woman" language="pt-BR">Não ouvi nada. Vou encerrar a chamada.</Say>
        <Hangup/>
      </Response>`;
    }
    // Initial welcome message
    else {
      console.log("Processing initial welcome");
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
      
      // Simple TwiML
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="woman" language="pt-BR">${welcomeMessage}</Say>
        <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="5" action="https://${Deno.env.get("SUPABASE_URL").split("https://")[1]}/functions/v1/process-dialog" method="POST">
        </Gather>
        <Say voice="woman" language="pt-BR">Não ouvi nada. Vou encerrar a chamada.</Say>
        <Hangup/>
      </Response>`;
    }
    
    // Return TwiML response with proper content type
    console.log("Sending TwiML response");
    return new Response(twimlResponse, {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });

  } catch (error) {
    console.error("Erro na função process-dialog:", error);
    
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

// Helper function to check if the message indicates an end to the conversation
function isEndingConversation(message) {
  const lowerMessage = message.toLowerCase();
  const endPhrases = ["tchau", "adeus", "até logo", "encerrar", "desligar", "finalizar"];
  return endPhrases.some(phrase => lowerMessage.includes(phrase));
}
