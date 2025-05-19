
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
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Credenciais do Supabase não estão configuradas");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request parameters
    const { 
      campaignId, 
      maxCalls = 5, 
      dryRun = false,
      respectBusinessHours = true
    } = await req.json();

    console.log(`Executor de campanha iniciado - Modo: ${dryRun ? 'Simulação' : 'Produção'}`);
    console.log(`Parâmetros: campaignId=${campaignId || 'todas'}, maxCalls=${maxCalls}`);

    // Check if current time is within business hours (9 AM to 6 PM)
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Default business hours: Monday-Friday, 9 AM - 6 PM
    const isBusinessHours = currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour < 18;
    
    // If respectBusinessHours is true and we're outside business hours, return early
    if (respectBusinessHours && !isBusinessHours) {
      console.log(`Fora do horário comercial (${currentDay}:${currentHour}). Nenhuma chamada será feita.`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Fora do horário comercial. Nenhuma chamada será feita.",
          processedCampaigns: 0,
          processedLeads: 0,
          errors: 0,
          dryRun,
          timestamp: now.toISOString(),
          businessHours: {
            isBusinessHours,
            currentDay,
            currentHour
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    
    // Process campaigns and make calls
    let processedCampaigns = 0;
    let processedLeads = 0;
    let errors = 0;
    
    // Get active campaigns
    let campaignsQuery = supabase
      .from("campaigns")
      .select("*, agents(*)")
      .eq("status", "active");
      
    // If campaignId is provided, filter by it
    if (campaignId) {
      campaignsQuery = campaignsQuery.eq("id", campaignId);
    }
    
    const { data: campaigns, error: campaignsError } = await campaignsQuery;
    
    if (campaignsError) {
      console.error("Erro ao buscar campanhas:", campaignsError);
      throw campaignsError;
    }
    
    console.log(`Encontradas ${campaigns?.length || 0} campanhas ativas`);
    
    // Process each campaign
    if (campaigns && campaigns.length > 0) {
      for (const campaign of campaigns) {
        try {
          // Ensure there is an agent and the agent is active
          if (!campaign.agent_id || campaign.agents?.status !== "active") {
            console.log(`Campanha ${campaign.id} pulada: agente inativo ou não encontrado`);
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
      message: `Execução de campanhas concluída: ${processedLeads} leads processados em ${processedCampaigns} campanhas`,
      processedCampaigns,
      processedLeads,
      errors,
      dryRun,
      timestamp: now.toISOString()
    };
    
    console.log(`Resultado: ${JSON.stringify(responseData)}`);
    
    // Return results
    return new Response(
      JSON.stringify(responseData),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
    
  } catch (error) {
    console.error("Error processing campaigns:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error",
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, "Content-Type": "application/json" } 
      }
    );
  }
});

// Process a single campaign
async function processCampaign(
  supabase: any, 
  campaign: any,
  maxCalls: number,
  dryRun: boolean
): Promise<{ processedLeads: number, errors: number }> {
  // Enhanced rate limiting by checking the most recent calls to avoid flooding
  const oneMinuteAgo = new Date();
  oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
  
  // Check how many calls have been made in the last minute to avoid rate limiting
  const { count: recentCallCount } = await supabase
    .from("call_logs")
    .select("*", { count: "exact", head: true })
    .gt("recorded_at", oneMinuteAgo.toISOString());
  
  // Simple rate limiting - no more than 10 calls per minute
  const maxCallsPerMinute = 10;
  if (recentCallCount >= maxCallsPerMinute) {
    console.log(`Taxa limite atingida: ${recentCallCount} chamadas no último minuto. Aguardando...`);
    return { processedLeads: 0, errors: 0 };
  }
  
  let processedLeads = 0;
  let errors = 0;

  try {
    console.log(`Buscando leads pendentes para campanha ${campaign.id}`);
    
    // Get pending leads for this campaign
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("status", "pending")
      .order("created_at")
      .limit(maxCalls);
      
    if (leadsError) {
      console.error(`Erro ao buscar leads para campanha ${campaign.id}:`, leadsError);
      return { processedLeads: 0, errors: 1 };
    }
    
    // If no pending leads, check if we should mark campaign as completed
    if (!leads || leads.length === 0) {
      console.log(`Nenhum lead pendente encontrado para campanha ${campaign.id}`);
      
      const { data: remainingLeads } = await supabase
        .from("leads")
        .select("count", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .not("status", "eq", "completed");
        
      if (remainingLeads && remainingLeads.count === 0) {
        // All leads completed, mark campaign as completed
        console.log(`Todos os leads processados. Marcando campanha ${campaign.id} como concluída`);
        
        if (!dryRun) {
          await supabase
            .from("campaigns")
            .update({ status: "completed", end_date: new Date().toISOString() })
            .eq("id", campaign.id);
        }
      }
      
      return { processedLeads: 0, errors: 0 };
    }
    
    console.log(`Processando ${leads.length} leads para campanha ${campaign.id}`);
    
    // Process each lead (make a call for each)
    for (const lead of leads) {
      try {
        console.log(`Processando lead: ${lead.name} (${lead.id})`);
        
        if (dryRun) {
          console.log(`[SIMULAÇÃO] Chamada seria feita para ${lead.phone}`);
          processedLeads++;
          continue;
        }
        
        // Make call via make-call function
        const callbackUrl = `${supabaseUrl}/functions/v1/call-status`;
        
        // Improved error handling for fetch operations
        try {
          const callResponse = await fetch(`${supabaseUrl}/functions/v1/make-call`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${supabaseServiceKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              phoneNumber: lead.phone,
              callbackUrl,
              agentId: campaign.agent_id,
              campaignId: campaign.id,
              leadId: lead.id,
              agentName: campaign.agents.name,
              voiceId: campaign.agents.voice_id,
              useAI: true
            })
          });
          
          if (!callResponse.ok) {
            const errorText = await callResponse.text();
            throw new Error(`HTTP error ${callResponse.status}: ${errorText}`);
          }
          
          const callResult = await callResponse.json();
          
          if (!callResult.success) {
            throw new Error(callResult.error || "Unknown error making call");
          }
          
          console.log(`Chamada iniciada com sucesso para lead ${lead.id}, SID: ${callResult.callSid}`);
          
          // Mark lead as called
          await supabase
            .from("leads")
            .update({
              status: "called",
              call_result: "Chamada em andamento"
            })
            .eq("id", lead.id);
            
          processedLeads++;
          
        } catch (fetchError) {
          console.error(`Erro ao chamar função make-call para lead ${lead.id}:`, fetchError);
          
          // Mark lead as failed
          await supabase
            .from("leads")
            .update({
              status: "failed",
              call_result: `Erro: ${fetchError.message || "Falha na chamada"}`
            })
            .eq("id", lead.id);
            
          errors++;
        }
        
        // Add a small delay between calls to avoid overwhelming the Twilio API
        if (processedLeads > 0 && processedLeads < leads.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (leadError) {
        console.error(`Erro ao processar lead ${lead.id}:`, leadError);
        
        if (!dryRun) {
          // Mark lead as failed
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
    console.error(`Erro geral em processCampaign para ${campaign.id}:`, error);
    return { processedLeads, errors: errors + 1 };
  }
}
