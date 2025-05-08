
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Inicializar cliente Supabase para armazenar os registros de chamadas
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Credenciais do Supabase não estão configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Processar a requisição
    const formData = await req.formData();
    const callSid = formData.get("CallSid")?.toString();
    const callStatus = formData.get("CallStatus")?.toString();
    const from = formData.get("From")?.toString();
    const to = formData.get("To")?.toString();
    const duration = formData.get("CallDuration")?.toString();
    
    // Obter parâmetros adicionais
    const agentId = formData.get("agentId")?.toString();
    const campaignId = formData.get("campaignId")?.toString();

    console.log(`Status da chamada recebido: ${callSid}, status: ${callStatus}`);
    
    // Registrar o status da chamada no Supabase
    const { error } = await supabase
      .from('call_logs')
      .upsert({
        call_sid: callSid,
        status: callStatus,
        from_number: from,
        to_number: to,
        duration: duration ? parseInt(duration) : null,
        agent_id: agentId,
        campaign_id: campaignId,
        recorded_at: new Date().toISOString(),
      });

    if (error) {
      console.error("Erro ao registrar log de chamada:", error);
    }

    // Retornar uma resposta vazia, apenas para confirmar recebimento
    return new Response(
      null,
      {
        status: 200,
        headers: { ...corsHeaders },
      }
    );
  } catch (error) {
    console.error("Erro ao processar status de chamada:", error);
    return new Response(
      null,
      {
        status: 200, // Sempre retornar 200 para o Twilio, mesmo em caso de erro
        headers: { ...corsHeaders },
      }
    );
  }
});
