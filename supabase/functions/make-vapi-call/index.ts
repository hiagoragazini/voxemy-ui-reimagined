

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

const VAPI_API_KEY = Deno.env.get("VAPI_API_KEY");
const VAPI_BASE_URL = "https://api.vapi.ai";

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!VAPI_API_KEY) {
      throw new Error("VAPI_API_KEY não configurada");
    }

    const {
      phoneNumber,
      agentId,
      campaignId,
      leadId,
      assistantId,
      message
    } = await req.json();

    console.log(`Iniciando chamada Vapi para: ${phoneNumber}`);
    console.log(`Parâmetros recebidos: agentId=${agentId}, campaignId=${campaignId}, leadId=${leadId}, assistantId=${assistantId}`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    
    // Format phone number for international calling
    let formattedPhone = cleanPhone;
    if (cleanPhone.length === 11 && cleanPhone.startsWith("11")) {
      // Brazilian mobile number with area code
      formattedPhone = `+55${cleanPhone}`;
    } else if (cleanPhone.length === 10) {
      // Brazilian landline with area code
      formattedPhone = `+55${cleanPhone}`;
    } else if (!cleanPhone.startsWith("+")) {
      // Assume Brazilian number if no country code
      formattedPhone = `+55${cleanPhone}`;
    }

    console.log(`Número formatado: ${formattedPhone}`);

    // First, check if assistantId is provided and valid by trying to get assistant info
    let validAssistantId = null;
    
    if (assistantId) {
      try {
        console.log(`Verificando assistantId: ${assistantId}`);
        const assistantCheckResponse = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${VAPI_API_KEY}`,
            "Content-Type": "application/json"
          }
        });
        
        if (assistantCheckResponse.ok) {
          validAssistantId = assistantId;
          console.log(`AssistantId ${assistantId} é válido`);
        } else {
          console.log(`AssistantId ${assistantId} não é válido, usando configuração padrão`);
        }
      } catch (err) {
        console.log(`Erro ao verificar assistantId: ${err.message}`);
      }
    }

    // Prepare Vapi call payload with CORRECT phoneNumber format (as object with number property)
    let vapiPayload;
    
    if (validAssistantId) {
      vapiPayload = {
        phoneNumber: {
          number: formattedPhone
        },
        assistantId: validAssistantId,
        assistantOverrides: {
          firstMessage: message || "Olá! Aqui é a Voxemy via Vapi AI. Como posso te ajudar hoje?"
        }
      };
    } else {
      // Create a basic call configuration without assistantId
      vapiPayload = {
        phoneNumber: {
          number: formattedPhone
        },
        assistant: {
          firstMessage: message || "Olá! Aqui é a Voxemy via Vapi AI. Como posso te ajudar hoje?",
          model: {
            provider: "openai",
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "Você é um assistente de voz da Voxemy via Vapi AI. Seja útil, educado e responda em português brasileiro."
              }
            ]
          },
          voice: {
            provider: "11labs",
            voiceId: "pFZP5JQG7iQjIQuC4Bku" // Lily voice ID
          }
        }
      };
    }

    console.log("Payload Vapi CORRIGIDO:", JSON.stringify(vapiPayload, null, 2));

    // Make call to Vapi API
    const vapiResponse = await fetch(`${VAPI_BASE_URL}/call`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(vapiPayload)
    });

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      console.error(`Erro Vapi API: ${vapiResponse.status} - ${errorText}`);
      throw new Error(`Vapi API error: ${vapiResponse.status} - ${errorText}`);
    }

    const vapiResult = await vapiResponse.json();
    console.log("Resposta Vapi:", JSON.stringify(vapiResult, null, 2));

    // Create call log record
    const { data: callLog, error: logError } = await supabase
      .from("call_logs")
      .insert({
        call_sid: vapiResult.id,
        status: "initiated",
        from_number: "+5511999999999", // Your Vapi phone number
        to_number: formattedPhone,
        agent_id: agentId || null,
        campaign_id: campaignId || null,
        lead_id: leadId || null,
        conversation_relay_active: false // Not using ConversationRelay anymore
      })
      .select()
      .single();

    if (logError) {
      console.error("Erro ao criar log da chamada:", logError);
    } else {
      console.log("Log da chamada criado:", callLog);
    }

    // Update lead status if leadId provided
    if (leadId) {
      const { error: leadError } = await supabase
        .from("leads")
        .update({
          status: "called",
          call_result: "Chamada Vapi iniciada"
        })
        .eq("id", leadId);

      if (leadError) {
        console.error("Erro ao atualizar lead:", leadError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        callId: vapiResult.id,
        callSid: vapiResult.id,
        status: vapiResult.status,
        message: "Chamada Vapi iniciada com sucesso",
        vapiResponse: vapiResult,
        usedAssistantId: validAssistantId
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error("Erro na função make-vapi-call:", error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro interno do servidor"
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

