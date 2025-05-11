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
    
    // Get request data - adicionando dados simulados para vídeo
    const { 
      campaignId, 
      maxCalls = 5, 
      dryRun = false,
      respectBusinessHours = true  // New parameter to respect business hours
    } = await req.json();

    // Check if current time is within business hours (9 AM to 6 PM)
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Default business hours: Monday-Friday, 9 AM - 6 PM
    const isBusinessHours = currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour < 18;
    
    // If respectBusinessHours is true and we're outside business hours, return early
    if (respectBusinessHours && !isBusinessHours) {
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
    
    // Dados simulados com base em uso de 10 dias
    const simulatedStats = {
      processedCampaigns: 5,
      processedLeads: 23,
      errors: 0,
      timestamp: now.toISOString(),
      campaignDetails: [
        {
          id: "c1b2a3-4d5e-6f7g-8h9i-0j1k2l3m4n5o",
          name: "Campanha Black Friday",
          totalLeads: 150,
          processedToday: 8,
          successRate: "78%"
        },
        {
          id: "9o8p7q-6r5s-4t3u-2v1w-0x9y8z7a6b5c",
          name: "Reengajamento Clientes Inativos",
          totalLeads: 120,
          processedToday: 5,
          successRate: "65%"
        },
        {
          id: "5d4e3f-2g1h-0i9j-8k7l-6m5n4o3p2q1r",
          name: "Cobrança Abril 2025",
          totalLeads: 45,
          processedToday: 4,
          successRate: "42%"
        },
        {
          id: "1s2t3u-4v5w-6x7y-8z9a-0b1c2d3e4f5g",
          name: "Pesquisa de Satisfação",
          totalLeads: 80,
          processedToday: 3,
          successRate: "94%"
        },
        {
          id: "6g7h8i-9j0k-1l2m-3n4o-5p6q7r8s9t0u",
          name: "Follow-up Reuniões",
          totalLeads: 75,
          processedToday: 3,
          successRate: "88%"
        }
      ],
      dailyStats: [
        { date: "2025-05-01", calls: 142, successRate: 76.2, avgDuration: "3:12" },
        { date: "2025-05-02", calls: 165, successRate: 75.8, avgDuration: "3:25" },
        { date: "2025-05-03", calls: 113, successRate: 77.1, avgDuration: "3:37" },
        { date: "2025-05-04", calls: 178, successRate: 76.9, avgDuration: "3:21" },
        { date: "2025-05-05", calls: 196, successRate: 77.2, avgDuration: "3:29" },
        { date: "2025-05-06", calls: 184, successRate: 77.5, avgDuration: "3:30" },
        { date: "2025-05-07", calls: 217, successRate: 77.8, avgDuration: "3:22" },
        { date: "2025-05-08", calls: 223, successRate: 78.1, avgDuration: "3:23" },
        { date: "2025-05-09", calls: 245, successRate: 78.2, avgDuration: "3:24" },
        { date: "2025-05-10", calls: 254, successRate: 78.5, avgDuration: "3:24" },
      ],
      totalCallsLast10Days: 1917,
      averageSuccessRate: "78.5%",
      averageDuration: "3:24",
    };
    
    // Registrando a execução no console para logs mais realistas
    console.log(`[${now.toISOString()}] Executor de campanha acionado`);
    console.log(`Campanhas processadas: ${simulatedStats.processedCampaigns}`);
    console.log(`Leads processados: ${simulatedStats.processedLeads}`);
    console.log(`Taxa média de sucesso hoje: ${simulatedStats.averageSuccessRate}`);
    
    // Return simulated results
    return new Response(
      JSON.stringify({
        success: true,
        message: "Execução de campanha concluída com sucesso",
        ...simulatedStats,
        dryRun
      }),
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

async function processCampaign(
  supabase: any, 
  campaignId: string, 
  maxCalls: number,
  dryRun: boolean
): Promise<{ processedLeads: number, errors: number }> {
  // Enhanced rate limiting by checking the most recent calls to avoid flooding
  const oneMinuteAgo = new Date();
  oneMinuteAgo.setMinutes(oneMinuteAgo.getMinutes() - 1);
  
  const { count: recentCallCount } = await supabase
    .from("call_logs")
    .select("*", { count: "exact", head: true })
    .gt("recorded_at", oneMinuteAgo.toISOString());
  
  // Simple rate limiting - no more than 10 calls per minute
  const maxCallsPerMinute = 10;
  if (recentCallCount >= maxCallsPerMinute) {
    console.log(`Rate limit reached: ${recentCallCount} calls in the last minute. Waiting...`);
    return { processedLeads: 0, errors: 0 };
  }
  
  let processedLeads = 0;
  let errors = 0;

  try {
    // Get campaign details
    const { data: campaign, error: campaignError } = await supabase
      .from("campaigns")
      .select("*, agents!inner(*)")
      .eq("id", campaignId)
      .single();
      
    if (campaignError) {
      console.error(`Error fetching campaign ${campaignId}:`, campaignError);
      return { processedLeads: 0, errors: 1 };
    }
    
    if (!campaign) {
      console.error(`Campaign ${campaignId} not found`);
      return { processedLeads: 0, errors: 1 };
    }
    
    // Check if campaign is active
    if (campaign.status !== "active") {
      console.log(`Campaign ${campaignId} is not active (${campaign.status})`);
      return { processedLeads: 0, errors: 0 };
    }
    
    // Get pending leads for this campaign
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .eq("campaign_id", campaignId)
      .eq("status", "pending")
      .order("created_at")
      .limit(maxCalls);
      
    if (leadsError) {
      console.error(`Error fetching leads for campaign ${campaignId}:`, leadsError);
      return { processedLeads: 0, errors: 1 };
    }
    
    // If no pending leads, mark campaign as completed if all leads are processed
    if (!leads || leads.length === 0) {
      const { data: remainingLeads } = await supabase
        .from("leads")
        .select("count", { count: "exact", head: true })
        .eq("campaign_id", campaignId)
        .not("status", "eq", "completed");
        
      if (remainingLeads && remainingLeads.count === 0) {
        // All leads completed, mark campaign as completed
        if (!dryRun) {
          await supabase
            .from("campaigns")
            .update({ status: "completed", end_date: new Date().toISOString() })
            .eq("id", campaignId);
        }
        
        console.log(`Campaign ${campaignId} marked as completed`);
      }
      
      return { processedLeads: 0, errors: 0 };
    }
    
    console.log(`Processing ${leads.length} leads for campaign ${campaignId}`);
    
    // Process each lead
    for (const lead of leads) {
      try {
        if (!dryRun) {
          // Make call via make-call function
          const callbackUrl = `${supabase.supabaseUrl}/functions/v1/call-status`;
          
          const callResponse = await fetch(`${supabase.supabaseUrl}/functions/v1/make-call`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${supabase.supabaseKey}`,
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
          
          const callResult = await callResponse.json();
          
          if (!callResult.success) {
            throw new Error(callResult.error || "Unknown error making call");
          }
          
          // Mark lead as called
          await supabase
            .from("leads")
            .update({
              status: "called",
              call_result: "Chamada em andamento"
            })
            .eq("id", lead.id);
        }
        
        processedLeads++;
        console.log(`Processed lead ${lead.id} (${lead.name})`);
      } catch (error) {
        console.error(`Error processing lead ${lead.id}:`, error);
        
        if (!dryRun) {
          // Mark lead as failed
          await supabase
            .from("leads")
            .update({
              status: "failed",
              call_result: `Erro: ${error.message || "Unknown error"}`
            })
            .eq("id", lead.id);
        }
        
        errors++;
      }
    }
    
    return { processedLeads, errors };
  } catch (error) {
    console.error(`Error in processCampaign for ${campaignId}:`, error);
    return { processedLeads, errors: errors + 1 };
  }
}
