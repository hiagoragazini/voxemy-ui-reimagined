
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

// Token de acesso da API Zenvia
const ZENVIA_API_TOKEN = Deno.env.get("ZENVIA_API_KEY") || "";

// Inicialização do cliente Zenvia
async function makeZenviaCall(params: any) {
  try {
    const { phoneNumber, message, voiceId } = params;
    
    console.log(`Fazendo chamada Zenvia para ${phoneNumber}`);
    
    // Endpoint da API Zenvia para chamadas de voz
    const zenviaApiUrl = "https://api.zenvia.com/v2/channels/voice/messages";
    
    // Formatar número de telefone para padrão E.164 conforme exigido pela Zenvia
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (!formattedPhone.startsWith('55') && (formattedPhone.length === 10 || formattedPhone.length === 11)) {
      formattedPhone = `55${formattedPhone}`;
    }
    
    // Preparar payload para a API da Zenvia
    const payload = {
      from: Deno.env.get("ZENVIA_FROM_NUMBER") || "zenvia-voice",
      to: formattedPhone,
      contents: [
        {
          type: "text",
          text: message
        }
      ],
      // Adicionar metadados para tracking
      id: `call-${Date.now()}`,
      direction: "outbound"
    };
    
    if (voiceId) {
      // Se tiver voiceId, adicionar informações de voz
      payload.contents[0].voiceId = voiceId;
    }
    
    // Adicionar referência ao webhook para resposta
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (supabaseUrl) {
      const callbackUrl = `${supabaseUrl.replace(/\/$/g, "")}/functions/v1/zenvia-process-dialog`;
      payload.contents[0].callbackUrl = callbackUrl;
    }
    
    console.log("Enviando requisição para Zenvia com payload:", JSON.stringify(payload, null, 2));
    console.log("Usando token:", ZENVIA_API_TOKEN ? "Token configurado" : "Token não configurado");
    
    // Configurar cabeçalhos com autenticação
    const headers = {
      "Content-Type": "application/json",
      "X-API-Token": ZENVIA_API_TOKEN
    };
    
    // Fazer a requisição para a API da Zenvia
    const response = await fetch(zenviaApiUrl, {
      method: "POST",
      headers: headers,
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error(`Erro na API Zenvia: ${response.status} - ${errorData}`);
      throw new Error(`Falha na API Zenvia: ${response.status} - ${errorData}`);
    }
    
    const data = await response.json();
    console.log("Resposta da API Zenvia:", data);
    
    return {
      id: data.id || `zenvia-call-${Date.now()}`,
      status: "initiated",
      responseData: data
    };
  } catch (error) {
    console.error("Erro ao fazer chamada Zenvia:", error);
    throw error;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Log de diagnóstico
    console.log("\n=== ZENVIA-CALL-HANDLER ===");
    console.log(`Timestamp: ${new Date().toISOString()}`);
    console.log(`Method: ${req.method}`);
    console.log(`URL: ${req.url}`);
    
    // Extrair dados da requisição
    const requestData = await req.json();
    console.log("Request data:", JSON.stringify(requestData, null, 2));
    
    // Validar API Token
    if (!ZENVIA_API_TOKEN) {
      console.error("ZENVIA_API_KEY não está configurada nas variáveis de ambiente");
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "API Token da Zenvia não configurado. Configure a variável ZENVIA_API_KEY.",
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" }
        }
      );
    }
    
    // Validar dados mínimos necessários
    const { phoneNumber, message } = requestData;
    
    if (!phoneNumber) {
      throw new Error("Número de telefone não fornecido");
    }
    
    if (!message) {
      throw new Error("Mensagem não fornecida");
    }
    
    // Fazer a chamada usando a API Zenvia
    const callResult = await makeZenviaCall(requestData);
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Chamada via Zenvia iniciada com sucesso",
        call_id: callResult.id,
        status: callResult.status,
        details: callResult.responseData
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Erro na função Zenvia:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro desconhecido",
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});
