
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para escapar caracteres XML
function escapeXML(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

// Função para sanitizar texto para TwiML
function sanitizeForTwiML(text: string): string {
  if (!text) return "";
  
  const cleaned = text
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
    
  return escapeXML(cleaned);
}

// Função para processar texto com OpenAI
async function processWithAI(text, conversationHistory = []) {
  const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
  
  if (!openAIApiKey) {
    console.error("[ERROR] process-dialog: OPENAI_API_KEY NÃO CONFIGURADA!");
    return "Olá! Estou com problemas técnicos no momento. Como posso ajudar de outra forma?";
  }

  try {
    console.log(`[DEBUG] process-dialog: Processando com IA: "${text}"`);
    console.log(`[DEBUG] process-dialog: Histórico: ${conversationHistory.length} mensagens`);
    
    const systemPrompt = {
      role: "system",
      content: `Você é Laura, assistente virtual da Voxemy.
      Seja cordial, profissional e concisa nas respostas.
      Limite respostas a 2-3 frases curtas para conversação telefônica.
      Fale português brasileiro natural.
      Evite caracteres especiais que podem causar problemas no áudio.
      Se cliente quiser encerrar, agradeça educadamente.`,
    };
    
    const messages = [
      systemPrompt,
      ...conversationHistory.slice(-4), // Últimas 4 mensagens
      { role: "user", content: text }
    ];
    
    console.log(`[DEBUG] process-dialog: Chamando OpenAI com ${messages.length} mensagens`);
    
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        max_tokens: 120,
        temperature: 0.7,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ERROR] process-dialog: OpenAI erro ${response.status}: ${errorText}`);
      return "Desculpe, estou com dificuldades técnicas. Poderia repetir sua pergunta?";
    }
    
    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content?.trim();
    
    if (!aiResponse) {
      console.error("[ERROR] process-dialog: Resposta vazia da OpenAI");
      return "Desculpe, não consegui processar sua mensagem. Pode repetir?";
    }
    
    console.log(`[SUCCESS] process-dialog: IA respondeu: "${aiResponse}"`);
    return aiResponse;
    
  } catch (error) {
    console.error(`[ERROR] process-dialog: Erro IA:`, error);
    return "Desculpe, estou tendo problemas para processar. Poderia tentar novamente?";
  }
}

// Função para salvar histórico
async function saveConversationHistory(supabase, callSid, messages, status = "active") {
  try {
    console.log(`[DEBUG] process-dialog: Salvando histórico call ${callSid}, ${messages.length} mensagens`);
    
    const { data, error } = await supabase
      .from("call_logs")
      .select("id, call_sid")
      .eq("call_sid", callSid)
      .maybeSingle();
    
    if (error) {
      console.error("[ERROR] process-dialog: Erro consulta call_logs:", error);
      return false;
    }
    
    if (!data) {
      console.log("[DEBUG] process-dialog: Criando novo registro");
      await supabase.from("call_logs").insert({
        call_sid: callSid,
        status: status,
        transcription: messages,
      });
    } else {
      console.log(`[DEBUG] process-dialog: Atualizando registro ${data.id}`);
      await supabase.from("call_logs").update({
        status: status,
        transcription: messages,
        updated_at: new Date().toISOString()
      }).eq("call_sid", callSid);
    }
    
    return true;
  } catch (error) {
    console.error("[ERROR] process-dialog: Erro salvar histórico:", error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("\n=== PROCESS-DIALOG HANDLER (VERSÃO CORRIGIDA) ===");
    console.log(`[DEBUG] process-dialog: ${new Date().toISOString()}`);
    console.log(`[DEBUG] process-dialog: Method: ${req.method}`);
    console.log(`[DEBUG] process-dialog: URL: ${req.url}`);
    
    const contentType = req.headers.get("Content-Type") || "";
    console.log(`[DEBUG] process-dialog: Content-Type: ${contentType}`);
    
    let requestData = {};
    
    try {
      if (contentType.includes("application/json")) {
        requestData = await req.json();
        console.log("[DEBUG] process-dialog: Parseado como JSON");
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        requestData = Object.fromEntries(formData.entries());
        console.log("[DEBUG] process-dialog: Parseado como form data");
      } else {
        const text = await req.text();
        console.log(`[DEBUG] process-dialog: Texto recebido (${text.length} chars): ${text.substring(0, 200)}...`);
        
        if (text.includes('=')) {
          const params = new URLSearchParams(text);
          requestData = Object.fromEntries(params.entries());
          console.log("[DEBUG] process-dialog: Parseado como URL encoded");
        }
      }
    } catch (parseError) {
      console.error(`[ERROR] process-dialog: Erro parse:`, parseError);
      requestData = {};
    }
    
    console.log(`[DEBUG] process-dialog: Dados recebidos:`, {
      keys: Object.keys(requestData),
      CallSid: requestData.CallSid,
      SpeechResult: requestData.SpeechResult,
      From: requestData.From,
      To: requestData.To,
      CallStatus: requestData.CallStatus
    });
    
    // Verificar OpenAI API Key
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      console.error("[CRITICAL] process-dialog: OPENAI_API_KEY NÃO CONFIGURADA!");
    } else {
      console.log("[SUCCESS] process-dialog: OPENAI_API_KEY encontrada");
    }
    
    // Inicializar Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[ERROR] process-dialog: Credenciais Supabase não configuradas");
      throw new Error("Credenciais Supabase não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Extrair dados principais
    const callSid = requestData.CallSid || requestData.callSid;
    const speechResult = requestData.SpeechResult || requestData.speechResult || "";
    const messages = requestData.messages || [];
    const endCall = requestData.endCall || false;
    const callStatus = requestData.CallStatus || "";
    
    console.log(`[DEBUG] process-dialog: CallSid: ${callSid}`);
    console.log(`[DEBUG] process-dialog: SpeechResult: "${speechResult}"`);
    console.log(`[DEBUG] process-dialog: CallStatus: "${callStatus}"`);
    console.log(`[DEBUG] process-dialog: EndCall: ${endCall}`);
    
    if (!callSid) {
      console.error("[ERROR] process-dialog: CallSid ausente");
      
      // TwiML de erro mais suave
      const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="pt-BR">Desculpe, houve um problema técnico. Obrigada pelo contato.</Say>
  <Hangup/>
</Response>`;

      return new Response(errorTwiml, {
        headers: { ...corsHeaders, "Content-Type": "application/xml" },
        status: 200
      });
    }

    let twimlResponse;
    
    // Função para detectar fim de conversa
    function isEndingConversation(message) {
      const lower = message.toLowerCase();
      const endPhrases = ["tchau", "adeus", "até logo", "encerrar", "desligar", "obrigado", "obrigada", "valeu", "brigado", "brigada"];
      return endPhrases.some(phrase => lower.includes(phrase));
    }
    
    // Processar fim de chamada
    if (endCall || (speechResult && isEndingConversation(speechResult))) {
      console.log("[DEBUG] process-dialog: Processando ENCERRAMENTO");
      
      const goodbyeMessage = "Obrigada pelo contato! Foi um prazer ajudar. Tenha um ótimo dia!";
      const sanitizedGoodbye = sanitizeForTwiML(goodbyeMessage);
      
      const updatedMessages = [...messages, {
        role: "assistant",
        content: goodbyeMessage,
        timestamp: new Date().toISOString()
      }];
      
      await saveConversationHistory(supabase, callSid, updatedMessages, "completed");
      
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="pt-BR">${sanitizedGoodbye}</Say>
  <Hangup/>
</Response>`;
    } 
    // Processar diálogo normal
    else if (speechResult && speechResult.trim().length > 0) {
      console.log("[DEBUG] process-dialog: Processando DIÁLOGO NORMAL");
      
      const updatedMessages = [...messages, {
        role: "user",
        content: speechResult,
        timestamp: new Date().toISOString()
      }];
      
      // Processar com IA
      const aiResponse = await processWithAI(
        speechResult, 
        updatedMessages.map(m => ({ role: m.role, content: m.content }))
      );
      
      const sanitizedAIResponse = sanitizeForTwiML(aiResponse);
      
      updatedMessages.push({
        role: "assistant",
        content: aiResponse,
        timestamp: new Date().toISOString()
      });
      
      await saveConversationHistory(supabase, callSid, updatedMessages);
      
      // Construir URL do próprio processo
      const currentUrl = new URL(req.url);
      const processUrl = `${currentUrl.protocol}//${currentUrl.hostname}/functions/v1/process-dialog`;
      
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="pt-BR">${sanitizedAIResponse}</Say>
  <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="15" action="${processUrl}" method="POST">
  </Gather>
  <Say voice="woman" language="pt-BR">Não consegui ouvir sua resposta. Obrigada pelo contato!</Say>
  <Hangup/>
</Response>`;
    }
    // Caso especial: SpeechResult vazio (possível causa da voz robótica)
    else if (requestData.hasOwnProperty('SpeechResult') && speechResult === "") {
      console.log("[WARNING] process-dialog: SpeechResult vazio - possível falha na captura de voz");
      
      const currentUrl = new URL(req.url);
      const processUrl = `${currentUrl.protocol}//${currentUrl.hostname}/functions/v1/process-dialog`;
      
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="pt-BR">Desculpe, não consegui ouvir. Pode repetir por favor?</Say>
  <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="15" action="${processUrl}" method="POST">
  </Gather>
  <Say voice="woman" language="pt-BR">Obrigada pelo contato. Tenha um bom dia!</Say>
  <Hangup/>
</Response>`;
    }
    // Mensagem inicial
    else {
      console.log("[DEBUG] process-dialog: Processando MENSAGEM INICIAL");
      
      const welcomeMessage = "Olá! Aqui é a Laura da Voxemy. Como posso ajudar você hoje?";
      const sanitizedWelcome = sanitizeForTwiML(welcomeMessage);
      
      const initialMessages = [{
        role: "assistant",
        content: welcomeMessage,
        timestamp: new Date().toISOString()
      }];
      
      await saveConversationHistory(supabase, callSid, initialMessages);
      
      const currentUrl = new URL(req.url);
      const processUrl = `${currentUrl.protocol}//${currentUrl.hostname}/functions/v1/process-dialog`;
      
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="pt-BR">${sanitizedWelcome}</Say>
  <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="15" action="${processUrl}" method="POST">
  </Gather>
  <Say voice="woman" language="pt-BR">Obrigada pelo contato. Tenha um ótimo dia!</Say>
  <Hangup/>
</Response>`;
    }
    
    console.log("[SUCCESS] process-dialog: Enviando resposta TwiML");
    console.log(`[DEBUG] process-dialog: TwiML (${twimlResponse.length} chars): ${twimlResponse.substring(0, 200)}...`);
    
    return new Response(twimlResponse, {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });

  } catch (error) {
    console.error("[ERROR] process-dialog: Erro na função:", {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    
    // TwiML de erro mais amigável
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="woman" language="pt-BR">Desculpe, houve um problema no sistema. Obrigada pelo contato.</Say>
  <Hangup/>
</Response>`;
    
    return new Response(errorTwiml, {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
      status: 200
    });
  }
});
