
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
      throw new Error("Supabase credentials are not configured");
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get request parameters
    const { 
      campaignId, 
      maxCalls = 5, 
      dryRun = false,
      respectBusinessHours = true
    } = await req.json();

    console.log(`Campaign executor started - Mode: ${dryRun ? 'Simulation' : 'Production'}`);
    console.log(`Parameters: campaignId=${campaignId || 'all'}, maxCalls=${maxCalls}`);

    // Check if current time is within business hours (9 AM to 6 PM)
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Default business hours: Monday-Friday, 9 AM - 6 PM
    const isBusinessHours = currentDay >= 1 && currentDay <= 5 && currentHour >= 9 && currentHour < 18;
    
    // If respectBusinessHours is true and we're outside business hours, return early
    if (respectBusinessHours && !isBusinessHours) {
      console.log(`Outside business hours (${currentDay}:${currentHour}). No calls will be made.`);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: "Outside business hours. No calls will be made.",
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
      console.error("Error fetching campaigns:", campaignsError);
      throw campaignsError;
    }
    
    console.log(`Found ${campaigns?.length || 0} active campaigns`);
    
    // Process each campaign
    if (campaigns && campaigns.length > 0) {
      for (const campaign of campaigns) {
        try {
          // Ensure there is an agent and the agent is active
          if (!campaign.agent_id || campaign.agents?.status !== "active") {
            console.log(`Campaign ${campaign.id} skipped: agent inactive or not found`);
            continue;
          }
          
          console.log(`Processing campaign: ${campaign.name} (${campaign.id})`);
          
          const result = await processCampaign(supabase, campaign, maxCalls, dryRun);
          processedLeads += result.processedLeads;
          errors += result.errors;
          
          if (result.processedLeads > 0 || result.errors > 0) {
            processedCampaigns++;
          }
        } catch (campaignError) {
          console.error(`Error processing campaign ${campaign.id}:`, campaignError);
          errors++;
        }
      }
    }
    
    const responseData = {
      success: true,
      message: `Campaign execution completed: ${processedLeads} leads processed in ${processedCampaigns} campaigns`,
      processedCampaigns,
      processedLeads,
      errors,
      dryRun,
      timestamp: now.toISOString()
    };
    
    console.log(`Result: ${JSON.stringify(responseData)}`);
    
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
    console.log(`Rate limit reached: ${recentCallCount} calls in the last minute. Waiting...`);
    return { processedLeads: 0, errors: 0 };
  }
  
  let processedLeads = 0;
  let errors = 0;

  try {
    console.log(`Fetching pending leads for campaign ${campaign.id}`);
    
    // Get pending leads for this campaign
    const { data: leads, error: leadsError } = await supabase
      .from("leads")
      .select("*")
      .eq("campaign_id", campaign.id)
      .eq("status", "pending")
      .order("created_at")
      .limit(maxCalls);
      
    if (leadsError) {
      console.error(`Error fetching leads for campaign ${campaign.id}:`, leadsError);
      return { processedLeads: 0, errors: 1 };
    }
    
    // If no pending leads, check if we should mark campaign as completed
    if (!leads || leads.length === 0) {
      console.log(`No pending leads found for campaign ${campaign.id}`);
      
      const { data: remainingLeads } = await supabase
        .from("leads")
        .select("count", { count: "exact", head: true })
        .eq("campaign_id", campaign.id)
        .not("status", "eq", "completed");
        
      if (remainingLeads && remainingLeads.count === 0) {
        // All leads completed, mark campaign as completed
        console.log(`All leads processed. Marking campaign ${campaign.id} as completed`);
        
        if (!dryRun) {
          await supabase
            .from("campaigns")
            .update({ status: "completed", end_date: new Date().toISOString() })
            .eq("id", campaign.id);
        }
      }
      
      return { processedLeads: 0, errors: 0 };
    }
    
    console.log(`Processing ${leads.length} leads for campaign ${campaign.id}`);
    
    // Process each lead (make a call for each)
    for (const lead of leads) {
      try {
        console.log(`Processing lead: ${lead.name} (${lead.id})`);
        
        if (dryRun) {
          console.log(`[SIMULATION] Call would be made to ${lead.phone}`);
          processedLeads++;
          continue;
        }
        
        // Create the message for the agent
        const message = `Olá${lead.name ? ' ' + lead.name : ''}, aqui é ${campaign.agents.name} da empresa. Como posso ajudar você hoje?`;
        
        // Make call via VAPI
        try {
          const callResponse = await supabase.functions.invoke("vapi-call-handler", {
            body: {
              phoneNumber: lead.phone,
              message,
              agentId: campaign.agent_id,
              campaignId: campaign.id,
              leadId: lead.id,
              voiceId: campaign.agents.voice_id
            }
          });
          
          if (callResponse.error) {
            throw new Error(callResponse.error.message || "Error making call");
          }
          
          const callResult = callResponse.data;
          
          if (!callResult.success) {
            throw new Error(callResult.error || "Unknown error making call");
          }
          
          console.log(`Call started successfully for lead ${lead.id}, ID: ${callResult.callId}`);
          
          // Mark lead as called
          await supabase
            .from("leads")
            .update({
              status: "called",
              call_result: "Call in progress"
            })
            .eq("id", lead.id);
            
          processedLeads++;
          
        } catch (fetchError) {
          console.error(`Error calling vapi-call-handler for lead ${lead.id}:`, fetchError);
          
          // Mark lead as failed
          await supabase
            .from("leads")
            .update({
              status: "failed",
              call_result: `Error: ${fetchError.message || "Call failed"}`
            })
            .eq("id", lead.id);
            
          errors++;
        }
        
        // Add a small delay between calls to avoid overwhelming the API
        if (processedLeads > 0 && processedLeads < leads.length) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
        
      } catch (leadError) {
        console.error(`Error processing lead ${lead.id}:`, leadError);
        
        if (!dryRun) {
          // Mark lead as failed
          await supabase
            .from("leads")
            .update({
              status: "failed",
              call_result: `Error: ${leadError.message || "Unknown error"}`
            })
            .eq("id", lead.id);
        }
        
        errors++;
      }
    }
    
    console.log(`Campaign ${campaign.id} completed: ${processedLeads} leads processed, ${errors} errors`);
    return { processedLeads, errors };
  } catch (error) {
    console.error(`General error in processCampaign for ${campaign.id}:`, error);
    return { processedLeads, errors: errors + 1 };
  }
}
