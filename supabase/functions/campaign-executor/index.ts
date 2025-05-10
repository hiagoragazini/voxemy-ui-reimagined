
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
    
    // Get request data
    const { 
      campaignId, 
      maxCalls = 5, 
      dryRun = false 
    } = await req.json();

    // Process campaigns
    let processedCampaigns = 0;
    let processedLeads = 0;
    let errors = 0;
    
    // If campaignId is provided, process only that campaign
    if (campaignId) {
      const result = await processCampaign(supabase, campaignId, maxCalls, dryRun);
      processedCampaigns = 1;
      processedLeads = result.processedLeads;
      errors = result.errors;
    } else {
      // Get all active campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select("id")
        .eq("status", "active");
        
      if (campaignsError) {
        throw campaignsError;
      }
      
      // Process each campaign
      if (campaigns && campaigns.length > 0) {
        processedCampaigns = campaigns.length;
        
        for (const campaign of campaigns) {
          const result = await processCampaign(supabase, campaign.id, maxCalls, dryRun);
          processedLeads += result.processedLeads;
          errors += result.errors;
        }
      }
    }
    
    // Return results
    return new Response(
      JSON.stringify({
        success: true,
        processedCampaigns,
        processedLeads,
        errors,
        dryRun
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error processing campaigns:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Unknown error"
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
