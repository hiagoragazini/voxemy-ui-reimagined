
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Função para inicializar o cliente Zenvia (será implementada quando tivermos as credenciais)
async function initZenviaClient(apiToken: string) {
  // Este é um placeholder que será substituído pela implementação real
  // quando tivermos acesso à documentação da API Zenvia
  console.log("Inicializando cliente Zenvia com token:", apiToken.substring(0, 5) + '...');
  return {
    // Métodos do cliente Zenvia serão implementados aqui
    makeCall: async (params: any) => {
      console.log("Simulando chamada Zenvia com parâmetros:", params);
      return {
        id: `zenvia-call-${Date.now()}`,
        status: "initiated"
      };
    }
  };
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
    
    // Obter credenciais Zenvia
    const zenviaApiToken = Deno.env.get("ZENVIA_API_TOKEN");
    const zenviaFromNumber = Deno.env.get("ZENVIA_FROM_NUMBER");
    
    if (!zenviaApiToken || !zenviaFromNumber) {
      console.error("Credenciais Zenvia ausentes:");
      console.error(`- ZENVIA_API_TOKEN: ${zenviaApiToken ? "configurado" : "não configurado"}`);
      console.error(`- ZENVIA_FROM_NUMBER: ${zenviaFromNumber ? "configurado" : "não configurado"}`);
      throw new Error("Credenciais Zenvia não configuradas completamente");
    }

    // Extrair campos da requisição
    const { phoneNumber, message, voiceId, agentId, campaignId, leadId } = requestData;
    
    if (!phoneNumber) {
      throw new Error("Número de telefone não fornecido");
    }
    
    if (!message) {
      throw new Error("Mensagem não fornecida");
    }
    
    // Formatar número de telefone para padrão brasileiro
    let formattedPhone = phoneNumber.replace(/\D/g, '');
    if (formattedPhone.length === 10 || formattedPhone.length === 11) {
      if (!formattedPhone.startsWith('55')) {
        formattedPhone = `55${formattedPhone}`;
      }
    }
    
    console.log(`Número formatado: ${formattedPhone}`);
    
    // Obter URL base para webhooks do Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    if (!supabaseUrl) {
      throw new Error("SUPABASE_URL não configurado");
    }
    
    // Construir a URL absoluta para o webhook de processamento
    const processWebhookUrl = `${supabaseUrl.replace(/\/$/g, "")}/functions/v1/zenvia-process-dialog`;
    console.log(`URL do webhook de processamento: ${processWebhookUrl}`);
    
    // Inicializar cliente Zenvia
    console.log("Inicializando cliente Zenvia...");
    const client = await initZenviaClient(zenviaApiToken);
    
    // Esta é uma implementação de placeholder que será substituída pela implementação real
    // quando tivermos acesso à documentação da API Zenvia
    console.log(`Iniciando chamada de ${zenviaFromNumber} para ${formattedPhone}`);
    console.log(`Mensagem: "${message}"`);
    
    // Simulação de chamada (será substituído pela implementação real)
    const call = await client.makeCall({
      from: zenviaFromNumber,
      to: formattedPhone,
      message: message,
      voice: voiceId,
      webhookUrl: processWebhookUrl,
      agentId: agentId,
      campaignId: campaignId,
      leadId: leadId
    });
    
    console.log(`Chamada iniciada: ID ${call.id}, status inicial: ${call.status}`);
    
    // Registro em base de dados (a ser implementado quando tivermos as credenciais)
    // Esta parte seria similar à implementação atual com o Twilio
    
    return new Response(
      JSON.stringify({
        success: true,
        message: "Chamada via Zenvia iniciada com sucesso",
        call_id: call.id,
        status: call.status
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
