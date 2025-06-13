
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Credenciais do Supabase não configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const { 
      campaignId, 
      maxCalls = 5, 
      dryRun = false,
      respectBusinessHours = true
    } = await req.json();

    console.log(`Campaign Executor iniciado - Modo: ${dryRun ? 'Simulação' : 'Produção'}`);
    console.log(`Parâmetros: campaignId=${campaignId || 'todas'}, maxCalls=${maxCalls}`);

    // Verificar horário comercial (9h às 18h, Segunda a Sexta)
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay();
    const isBusinessHours = currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour < 18;
    
    if (respectBusinessHours && !isBusinessHours) {
      console.log(`Fora do horário comercial (${currentDay}:${currentHour}). Execução cancelada.`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Fora do horário comercial. Nenhuma ligação será feita.",
          processedCampaigns: 0,
          processedLeads: 0,
          errors: 0,
          dryRun,
          timestamp: now.toISOString(),
          businessHours: { isBusinessHours, currentDay, currentHour }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Rate limiting - verificar chamadas recentes
    const oneMinuteAgo = new Date();
    oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
    
    const { count: recentCallCount } = await supabase
      .from("call_logs")
      .select("*", { count: "exact", head: true })
      .gt("recorded_at", oneMinuteAgo.toISOString());
    
    const maxCallsPerMinute = 10;
    if (recentCallCount >= maxCallsPerMinute) {
      console.log(`Rate limit atingido: ${recentCallCount} chamadas no último minuto.`);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Rate limit atingido. Aguardando próximo ciclo.",
          processedCampaigns: 0,
          processedLeads: 0,
          errors: 0,
          rateLimited: true
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    let processedCampaigns = 0;
    let processedLeads = 0;
    let errors = 0;
    
    // Buscar campanhas ativas
    let campaignsQuery = supabase
      .from("campaigns")
      .select("*, agents(*)")
      .eq("status", "active");
      
    if (campaignId) {
      campaignsQuery = campaignsQuery.eq("id", campaignId);
    }
    
    const { data: campaigns, error: campaignsError } = await campaignsQuery;
    
    if (campaignsError) {
      console.error("Erro ao buscar campanhas:", campaignsError);
      throw campaignsError;
    }
    
    console.log(`Encontradas ${campaigns?.length || 0} campanhas ativas`);
    
    if (campaigns && campaigns.length > 0) {
      for (const campaign of campaigns) {
        try {
          if (!campaign.agent_id || campaign.agents?.status !== "active") {
            console.log(`Campanha ${campaign.id} pulada: agente inativo`);
            continue;
          }
          
          console.log(`Processando campanha: ${campaign.name} (${campaign.id})`);
          
          const result = await processCampaign(supabase, campaign, maxCalls, dryRun);
          processedLeads += result.processedLeads;
          errors += result.errors;
          
          if (result.processedLeads > 0 || result.errors > 0) {
            processedCampaigns++;
          }
        } catch (campaignError) {
          console.error(`Erro ao processar campanha ${campaign.id}:`, campaignError);
          errors++;
        }
      }
    }
    
    const responseData = {
      success: true,
      message: `Execução concluída: ${processedLeads} leads processados em ${processedCampaigns} campanhas`,
      processedCampaigns,
      processedLeads,
      errors,
      dryRun,
      timestamp: now.toISOString()
    };
    
    console.log(`Resultado final: ${JSON.stringify(responseData)}`);
    
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Erro no campaign-executor:", error);
    
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

async function processCampaign(
  supabase: any, 
  campaign: any,
  maxCalls: number,
  dryRun: boolean
): Promise<{ processedLeads: number, errors: number }> {
  let processedLeads = 0;
  let errors = 0;

  try {
    console.log(`Buscando leads pendentes para campanha ${campaign.id}`);
    
    // Buscar leads pendentes
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("status", "pending")
      .order("created_at")
      .limit(maxCalls);
      
    if (leadsError) {
      console.error(`Erro ao buscar leads:`, leadsError);
      return { processedLeads: 0, errors: 1 };
    }
    
    if (!leads || leads.length === 0) {
      console.log(`Nenhum lead pendente para campanha ${campaign.id}`);
      
      // Verificar se todos os leads foram processados
      const { count: remainingLeads } = await supabase
        .from("leads")
        .select("*", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .eq("status", "pending");
        
      if (remainingLeads === 0) {
        console.log(`Todos os leads processados. Marcando campanha ${campaign.id} como concluída`);
        
        if (!dryRun) {
          await supabase
            .from("campaigns")
            .update({ 
              status: "completed", 
              end_date: new Date().toISOString() 
            })
            .eq("id", campaign.id);
        }
      }
      
      return { processedLeads: 0, errors: 0 };
    }
    
    console.log(`Processando ${leads.length} leads para campanha ${campaign.id}`);
    
    for (const lead of leads) {
      try {
        console.log(`Processando lead: ${lead.name} (${lead.phone})`);
        
        if (dryRun) {
          console.log(`[SIMULAÇÃO] Ligação seria feita para ${lead.phone}`);
          processedLeads++;
          continue;
        }
        
        // Preparar mensagem personalizada baseada no agente
        const agent = campaign.agents;
        let message = agent.default_greeting || 
          `Olá ${lead.name}, aqui é ${agent.name}. Como posso ajudá-lo hoje?`;
        
        // Personalizar mensagem com informações do lead e campanha
        message = message
          .replace(/\{nome\}/g, lead.name || "")
          .replace(/\{campanha\}/g, campaign.name || "");
        
        // Fazer ligação via make-call
        const { error: callError } = await supabase.functions.invoke('make-call', {
          body: {
            phoneNumber: lead.phone,
            callbackUrl: `${Deno.env.get("SUPABASE_URL")}/functions/v1/call-status`,
            agentId: campaign.agent_id,
            campaignId: campaign.id,
            leadId: lead.id,
            agentName: agent.name,
            voiceId: agent.voice_id || "21m00Tcm4TlvDq8ikWAM",
            useAI: true,
            message: message,
            recordCall: true,
            transcribeCall: true
          }
        });
        
        if (callError) {
          console.error(`Erro ao fazer ligação para lead ${lead.id}:`, callError);
          
          // Marcar lead como falhado
          await supabase
            .from("leads")
            .update({
              status: "failed",
              call_result: `Erro: ${callError.message || "Falha na ligação"}`
            })
            .eq("id", lead.id);
            
          errors++;
        } else {
          console.log(`Ligação iniciada com sucesso para lead ${lead.id}`);
          
          // Marcar lead como chamado
          await supabase
            .from("leads")
            .update({
              status: "called",
              call_result: "Ligação em andamento"
            })
            .eq("id", lead.id);
            
          processedLeads++;
        }
        
        // Pausa entre ligações para evitar sobrecarga
        if (processedLeads > 0 && processedLeads < leads.length) {
          await new Promise(resolve => setTimeout(resolve, 3000));
        }
        
      } catch (leadError) {
        console.error(`Erro ao processar lead ${lead.id}:`, leadError);
        
        if (!dryRun) {
          await supabase
            .from("leads")
            .update({
              status: "failed",
              call_result: `Erro: ${leadError.message || "Erro desconhecido"}`
            })
            .eq("id", lead.id);
        }
        
        errors++;
      }
    }
    
    console.log(`Campanha ${campaign.id} concluída: ${processedLeads} leads processados, ${errors} erros`);
    return { processedLeads, errors };
  } catch (error) {
    console.error(`Erro geral em processCampaign:`, error);
    return { processedLeads, errors: errors + 1 };
  }
}
