
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Sleep function para debugging
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Processar apenas chamadas POST
    if (req.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Método não permitido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
      );
    }

    // Carregar dados do formulário
    const formData = await req.formData();
    
    // Extrair os valores dos campos
    const callSid = formData.get("CallSid");
    const callStatus = formData.get("CallStatus");
    const direction = formData.get("Direction");
    const from = formData.get("From");
    const to = formData.get("To");
    const callDuration = formData.get("CallDuration");
    
    console.log(`[DEBUG] call-status: Callback recebido para chamada ${callSid}:`);
    console.log(`- Status: ${callStatus}`);
    console.log(`- De: ${from} Para: ${to}`);
    console.log(`- Direção: ${direction}`);
    console.log(`- Duração: ${callDuration || 'N/A'}`);

    // Verificar se temos o SID da chamada
    if (!callSid) {
      console.error("[ERROR] call-status: CallSid não fornecido no callback");
      return new Response(
        JSON.stringify({ error: "CallSid não fornecido" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
      );
    }

    // Inicializar cliente do Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[ERROR] call-status: Credenciais do Supabase não estão configuradas");
      return new Response(
        JSON.stringify({ error: "Erro de configuração do servidor" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verificar se já existe um registro para esta chamada
    const { data: existingCall, error: fetchError } = await supabase
      .from("call_logs")
      .select("id, status")
      .eq("call_sid", callSid)
      .maybeSingle();
    
    if (fetchError) {
      console.error(`[ERROR] call-status: Erro ao buscar chamada: ${fetchError.message}`);
    }
    
    // Se a chamada não existir e o status for "initiated", criamos um novo registro
    if (!existingCall && callStatus === "initiated") {
      const { error: insertError } = await supabase
        .from("call_logs")
        .insert({
          call_sid: callSid,
          status: callStatus,
          from_number: from ? from.toString() : null,
          to_number: to ? to.toString() : null
        });
      
      if (insertError) {
        console.error(`[ERROR] call-status: Erro ao inserir registro de chamada: ${insertError.message}`);
      } else {
        console.log(`[DEBUG] call-status: Novo registro de chamada criado para SID ${callSid}`);
      }
    } 
    // Se a chamada existir, atualizamos o status
    else if (existingCall) {
      const updateData: Record<string, any> = { status: callStatus };
      
      // Se a chamada foi completada, registramos a duração
      if (callStatus === "completed" && callDuration) {
        updateData.duration = parseInt(callDuration.toString(), 10);
      }
      
      const { error: updateError } = await supabase
        .from("call_logs")
        .update(updateData)
        .eq("call_sid", callSid);
      
      if (updateError) {
        console.error(`[ERROR] call-status: Erro ao atualizar status da chamada: ${updateError.message}`);
      } else {
        console.log(`[DEBUG] call-status: Status da chamada atualizado para "${callStatus}"`);
      }
    }
    // Se não existir e não for "initiated", registramos mesmo assim
    else {
      const { error: insertError } = await supabase
        .from("call_logs")
        .insert({
          call_sid: callSid,
          status: callStatus,
          from_number: from ? from.toString() : null,
          to_number: to ? to.toString() : null,
          duration: callDuration ? parseInt(callDuration.toString(), 10) : null
        });
      
      if (insertError) {
        console.error(`[ERROR] call-status: Erro ao inserir registro de chamada tardia: ${insertError.message}`);
      } else {
        console.log(`[DEBUG] call-status: Registro de chamada tardio criado para SID ${callSid}`);
      }
    }
    
    // Verificar se é uma chamada que foi atendida
    if (callStatus === "in-progress") {
      console.log(`[DEBUG] call-status: Chamada ${callSid} foi atendida!`);
      
      // Aqui poderíamos iniciar outras ações ou registros adicionais quando a chamada é atendida
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Status da chamada ${callSid} atualizado para ${callStatus}` 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error(`[ERROR] call-status: Erro no processamento do status: ${error}`);
    
    return new Response(
      JSON.stringify({ 
        error: true, 
        message: error.message || "Erro desconhecido no processamento" 
      }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" }, 
        status: 500 
      }
    );
  }
});
