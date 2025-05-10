
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
    const leadId = formData.get("leadId")?.toString();

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

    // Update lead status if leadId is provided
    if (leadId && callStatus) {
      try {
        // Process based on call status
        let leadStatus = "called";
        let callResult = `Chamada ${callStatus}`;
        let callDuration = null;
        
        if (callStatus === "completed") {
          leadStatus = "completed";
          callResult = "Chamada completada com sucesso";
          callDuration = duration ? `${Math.floor(parseInt(duration) / 60)}:${(parseInt(duration) % 60).toString().padStart(2, '0')}` : null;
        } else if (callStatus === "failed" || callStatus === "busy" || callStatus === "no-answer") {
          leadStatus = "failed";
          callResult = `Chamada falhou: ${callStatus}`;
        }
        
        await supabase
          .from("leads")
          .update({ 
            status: leadStatus,
            call_result: callResult,
            call_duration: callDuration
          })
          .eq("id", leadId);
        
        // If this is part of a campaign, update campaign statistics
        if (campaignId && callStatus === "completed") {
          // Get current campaign data
          const { data: campaign } = await supabase
            .from("campaigns")
            .select("completed_leads, total_leads, avg_call_duration")
            .eq("id", campaignId)
            .single();
            
          if (campaign) {
            const newCompletedLeads = (campaign.completed_leads || 0) + 1;
            const successRate = Math.round((newCompletedLeads / (campaign.total_leads || 1)) * 100);
            
            // Calculate new average duration
            let newAvgDuration = campaign.avg_call_duration || "0:00";
            if (duration) {
              // Parse current avg duration
              const [avgMins, avgSecs] = (campaign.avg_call_duration || "0:00").split(":").map(Number);
              const currentAvgSeconds = avgMins * 60 + avgSecs;
              
              // Calculate new avg duration
              const totalDurationSeconds = currentAvgSeconds * (newCompletedLeads - 1) + parseInt(duration);
              const newAvgSeconds = Math.floor(totalDurationSeconds / newCompletedLeads);
              newAvgDuration = `${Math.floor(newAvgSeconds / 60)}:${(newAvgSeconds % 60).toString().padStart(2, '0')}`;
            }
            
            // Update campaign stats
            await supabase
              .from("campaigns")
              .update({
                completed_leads: newCompletedLeads,
                success_rate: successRate,
                avg_call_duration: newAvgDuration
              })
              .eq("id", campaignId);
          }
        }
      } catch (err) {
        console.error("Error updating lead/campaign status:", err);
      }
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
