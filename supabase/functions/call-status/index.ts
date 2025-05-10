
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import OpenAI from "https://esm.sh/openai@4.20.1";

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
    let openai = null;
    
    // Check if OpenAI API key is available for transcription analysis
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (openaiApiKey) {
      openai = new OpenAI({
        apiKey: openaiApiKey
      });
    }

    // Processar a requisição
    const formData = await req.formData();
    const callSid = formData.get("CallSid")?.toString();
    const callStatus = formData.get("CallStatus")?.toString();
    const from = formData.get("From")?.toString();
    const to = formData.get("To")?.toString();
    const duration = formData.get("CallDuration")?.toString();
    const transcriptionStatus = formData.get("TranscriptionStatus")?.toString();
    const transcriptionText = formData.get("TranscriptionText")?.toString();
    
    // Obter parâmetros adicionais
    const agentId = formData.get("agentId")?.toString();
    const campaignId = formData.get("campaignId")?.toString();
    const leadId = formData.get("leadId")?.toString();
    const recordCall = formData.get("recordCall")?.toString() === "true";
    const transcribeCall = formData.get("transcribeCall")?.toString() === "true";

    console.log(`Status da chamada recebido: ${callSid}, status: ${callStatus}`);
    
    // Analyze call transcription if available
    let callAnalysis = null;
    if (transcriptionText && transcriptionStatus === "completed" && openai) {
      try {
        console.log("Analyzing call transcription with OpenAI");
        
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are an AI assistant that analyzes call transcriptions. Analyze the following call transcription and categorize it as one of these: [INTERESTED, CALLBACK_REQUESTED, NOT_INTERESTED, WRONG_NUMBER, NO_ANSWER, TECHNICAL_ISSUE]. Also extract key information and provide a 1-2 sentence summary. Format your response as JSON with fields: category, summary, key_points (array), sentiment (positive/neutral/negative)."
            },
            {
              role: "user",
              content: transcriptionText
            }
          ],
          temperature: 0.2,
          response_format: { type: "json_object" }
        });
        
        callAnalysis = JSON.parse(response.choices[0].message.content);
        console.log("Call analysis completed:", callAnalysis);
      } catch (error) {
        console.error("Error analyzing call transcription:", error);
      }
    }
    
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
        transcription: transcriptionText,
        transcription_status: transcriptionStatus,
        call_analysis: callAnalysis,
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
          
          // If we have call analysis, use that for additional context
          if (callAnalysis) {
            callResult = callAnalysis.summary || callResult;
            
            // Set a more specific lead status based on the call analysis
            switch(callAnalysis.category) {
              case "INTERESTED":
                leadStatus = "interested";
                break;
              case "CALLBACK_REQUESTED":
                leadStatus = "callback";
                break;
              case "NOT_INTERESTED":
                leadStatus = "not_interested";
                break;
              case "WRONG_NUMBER":
                leadStatus = "wrong_number";
                break;
              case "NO_ANSWER":
                leadStatus = "no_answer";
                break;
              default:
                leadStatus = "completed";
                break;
            }
          }
        } else if (callStatus === "failed" || callStatus === "busy" || callStatus === "no-answer") {
          leadStatus = "failed";
          callResult = `Chamada falhou: ${callStatus}`;
        }
        
        const updateData: any = { 
          status: leadStatus,
          call_result: callResult,
          call_duration: callDuration
        };
        
        // Add transcription if available
        if (transcriptionText) {
          updateData.transcription = transcriptionText;
          
          // Add simplified sentiment analysis if available
          if (callAnalysis && callAnalysis.sentiment) {
            updateData.sentiment = callAnalysis.sentiment;
          }
        }
        
        await supabase
          .from("leads")
          .update(updateData)
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
