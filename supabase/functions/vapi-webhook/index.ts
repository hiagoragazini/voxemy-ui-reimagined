
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const webhookData = await req.json();
    
    console.log("Webhook Vapi recebido:", JSON.stringify(webhookData, null, 2));

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { type, call } = webhookData;

    if (!call || !call.id) {
      console.warn("Webhook sem dados de chamada válidos");
      return new Response("OK", { headers: corsHeaders });
    }

    let status = "unknown";
    let transcription = null;

    // Map Vapi call status to our system
    switch (type) {
      case "call-started":
        status = "in-progress";
        break;
      case "call-ended":
        status = "completed";
        // Extract transcript if available
        if (call.transcript && call.transcript.length > 0) {
          transcription = JSON.stringify(call.transcript);
        }
        break;
      case "call-failed":
        status = "failed";
        break;
      default:
        status = call.status || "unknown";
    }

    // Update call log
    const { error: updateError } = await supabase
      .from("call_logs")
      .update({
        status: status,
        transcription: transcription,
        transcription_status: transcription ? "completed" : "none",
        duration: call.duration || null,
        call_analysis: call.analysis ? JSON.stringify(call.analysis) : null
      })
      .eq("call_sid", call.id);

    if (updateError) {
      console.error("Erro ao atualizar call_logs:", updateError);
    } else {
      console.log(`Call log atualizado para ${call.id}: status=${status}`);
    }

    // Update lead status if this was a campaign call
    if (status === "completed" || status === "failed") {
      const { data: callLog } = await supabase
        .from("call_logs")
        .select("lead_id, campaign_id")
        .eq("call_sid", call.id)
        .single();

      if (callLog?.lead_id) {
        const leadStatus = status === "completed" ? "completed" : "failed";
        const callResult = status === "completed" 
          ? "Chamada concluída com sucesso" 
          : `Chamada falhou: ${call.endedReason || "Motivo desconhecido"}`;

        const { error: leadError } = await supabase
          .from("leads")
          .update({
            status: leadStatus,
            call_result: callResult,
            transcription: transcription,
            call_duration: call.duration ? `${Math.floor(call.duration / 60)}:${String(call.duration % 60).padStart(2, '0')}` : null
          })
          .eq("id", callLog.lead_id);

        if (leadError) {
          console.error("Erro ao atualizar lead:", leadError);
        } else {
          console.log(`Lead ${callLog.lead_id} atualizado: ${leadStatus}`);
        }

        // Update campaign statistics
        if (callLog.campaign_id) {
          if (status === "completed") {
            await supabase.rpc("increment_campaign_completed", {
              campaign_id: callLog.campaign_id
            });
          }
        }
      }
    }

    return new Response("OK", { headers: corsHeaders });

  } catch (error) {
    console.error("Erro no webhook Vapi:", error);
    return new Response("Internal Server Error", {
      status: 500,
      headers: corsHeaders
    });
  }
});
