
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
    
    // Fazer a chamada para a API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Modelo mais rápido e econômico
      messages,
      max_tokens: 150,
      temperature: 0.7,
    });
    
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("Erro ao processar texto com AI:", error);
    return "Desculpe, estou tendo dificuldades para processar sua mensagem. Poderia repetir de outra forma?";
  }
}

// Função para salvar histórico de conversa
async function saveConversationHistory(supabase, callSid, messages, status = "active") {
  try {
    // Verificar se já existe um registro para essa chamada
    const { data, error } = await supabase
      .from("call_logs")
      .select("id, call_sid, transcription")
      .eq("call_sid", callSid)
      .maybeSingle();
    
    if (error) throw error;
    
    // Se não existir, criar um novo registro
    if (!data) {
      await supabase.from("call_logs").insert({
        call_sid: callSid,
        status: status,
        transcription: messages,
      });
    } else {
      // Se existir, atualizar o registro
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

// Função para gerar áudio com ElevenLabs
async function generateSpeech(text, voiceId = "21m00Tcm4TlvDq8ikWAM") { // Antônio (pt-BR)
  try {
    const elevenlabsApiKey = Deno.env.get("ELEVENLABS_API_KEY");
    
    if (!elevenlabsApiKey) {
      throw new Error("ElevenLabs API Key não configurada");
    }
    
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "xi-api-key": elevenlabsApiKey,
        },
        body: JSON.stringify({
          text: text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5,
            style: 0.0,
            use_speaker_boost: true
          }
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`ElevenLabs API error: ${errorText}`);
    }

    // Obter o buffer de áudio
    const audioBuffer = await response.arrayBuffer();
    
    // Converter para base64
    const base64Audio = btoa(
      String.fromCharCode(...new Uint8Array(audioBuffer))
    );
    
    return base64Audio;
  } catch (error) {
    console.error("Erro ao gerar áudio com ElevenLabs:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Inicializar cliente Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Credenciais Supabase não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Obter dados da requisição
    const requestData = await req.json();
    
    // Verificar dados essenciais
    const { 
      callSid, 
      speechResult, 
      phoneNumber,
      messages = [], 
      endCall = false 
    } = requestData;
    
    // Validar os dados
    if (!callSid) {
      throw new Error("ID da chamada (callSid) não fornecido");
    }

    let twimlResponse;
    
    // Se mensagem final ou flag de encerramento
    if (endCall) {
      // Mensagem de despedida
      const goodbyeMessage = "Obrigado pelo contato! Espero ter ajudado. Tenha um ótimo dia!";
      
      // Adicionar mensagem de despedida ao histórico
      const updatedMessages = [...messages, {
        role: "assistant",
        content: goodbyeMessage,
        timestamp: new Date().toISOString()
      }];
      
      // Salvar no Supabase
      await saveConversationHistory(supabase, callSid, updatedMessages, "completed");
      
      // Gerar TwiML de despedida
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="woman" language="pt-BR">${goodbyeMessage}</Say>
        <Hangup/>
      </Response>`;
    } 
    // Processamento normal de diálogo
    else if (speechResult) {
      console.log(`Processando transcrição: "${speechResult}" para chamada ${callSid}`);
      
      // Adicionar fala do usuário ao histórico
      const updatedMessages = [...messages, {
        role: "user",
        content: speechResult,
        timestamp: new Date().toISOString()
      }];
      
      // Verificar se é pedido de encerramento
      const lowerMessage = speechResult.toLowerCase();
      const endPhrases = ["tchau", "adeus", "até logo", "encerrar", "desligar", "finalizar"];
      const isEndingConversation = endPhrases.some(phrase => lowerMessage.includes(phrase));
      
      if (isEndingConversation) {
        // Mensagem de despedida
        const goodbyeMessage = "Obrigado pelo contato! Espero ter ajudado. Tenha um ótimo dia!";
        
        // Adicionar resposta de despedida ao histórico
        updatedMessages.push({
          role: "assistant",
          content: goodbyeMessage,
          timestamp: new Date().toISOString()
        });
        
        // Salvar no Supabase
        await saveConversationHistory(supabase, callSid, updatedMessages, "completed");
        
        // Gerar TwiML de despedida
        twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
        <Response>
          <Say voice="woman" language="pt-BR">${goodbyeMessage}</Say>
          <Hangup/>
        </Response>`;
      } else {
        // Processar com AI
        const aiResponse = await processWithAI(
          speechResult, 
          updatedMessages.map(m => ({ role: m.role, content: m.content }))
        );
        
        // Adicionar resposta da AI ao histórico
        updatedMessages.push({
          role: "assistant",
          content: aiResponse,
          timestamp: new Date().toISOString()
        });
        
        // Salvar no Supabase
        await saveConversationHistory(supabase, callSid, updatedMessages);
        
        // Tentar usar ElevenLabs para síntese de voz
        let useElevenLabs = true;
        let audioContent = null;
        
        try {
          if (Deno.env.get("ELEVENLABS_API_KEY")) {
            audioContent = await generateSpeech(aiResponse);
          } else {
            useElevenLabs = false;
          }
        } catch (audioError) {
          console.error("Erro ao gerar áudio com ElevenLabs:", audioError);
          useElevenLabs = false;
        }
        
        // Gerar TwiML com áudio ou texto
        if (useElevenLabs && audioContent) {
          // Usar ElevenLabs (implementação: enviar URL do áudio gerado)
          twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="woman" language="pt-BR">${aiResponse}</Say>
            <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="5" action="https://${Deno.env.get("SUPABASE_URL").split("https://")[1]}/functions/v1/process-dialog" method="POST">
            </Gather>
            <Say voice="woman" language="pt-BR">Não ouvi nada. Vou encerrar a chamada.</Say>
            <Hangup/>
          </Response>`;
        } else {
          // Fallback para TTS nativo do Twilio
          twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
          <Response>
            <Say voice="woman" language="pt-BR">${aiResponse}</Say>
            <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="5" action="https://${Deno.env.get("SUPABASE_URL").split("https://")[1]}/functions/v1/process-dialog" method="POST">
            </Gather>
            <Say voice="woman" language="pt-BR">Não ouvi nada. Vou encerrar a chamada.</Say>
            <Hangup/>
          </Response>`;
        }
      }
    } else {
      // Mensagem inicial se não houver transcrição
      const welcomeMessage = "Olá, aqui é da Voxemy. Como posso ajudar você hoje?";
      
      // Iniciar histórico de conversa
      const initialMessages = [{
        role: "assistant",
        content: welcomeMessage,
        timestamp: new Date().toISOString()
      }];
      
      // Salvar no Supabase
      await saveConversationHistory(supabase, callSid, initialMessages);
      
      // Gerar TwiML inicial
      twimlResponse = `<?xml version="1.0" encoding="UTF-8"?>
      <Response>
        <Say voice="woman" language="pt-BR">${welcomeMessage}</Say>
        <Gather input="speech" language="pt-BR" speechTimeout="auto" timeout="5" action="https://${Deno.env.get("SUPABASE_URL").split("https://")[1]}/functions/v1/process-dialog" method="POST">
        </Gather>
        <Say voice="woman" language="pt-BR">Não ouvi nada. Vou encerrar a chamada.</Say>
        <Hangup/>
      </Response>`;
    }
    
    // Retornar resposta TwiML
    return new Response(twimlResponse, {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });

  } catch (error) {
    console.error("Erro na função process-dialog:", error);
    
    // TwiML de erro
    const errorTwiml = `<?xml version="1.0" encoding="UTF-8"?>
    <Response>
      <Say voice="woman" language="pt-BR">Desculpe, ocorreu um erro no sistema. Vou encerrar a chamada.</Say>
      <Hangup/>
    </Response>`;
    
    return new Response(errorTwiml, {
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
      status: 500
    });
  }
});
