

import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "../_shared/cors.ts";

// VERSION LOG - Official structure with smart fallback
const FUNCTION_VERSION = "v3.0.0-vapi-official-with-fallback-2025-01-27";
console.log(`🚀 MAKE-VAPI-CALL FUNCTION STARTED - VERSION: ${FUNCTION_VERSION}`);

const VAPI_API_KEY = Deno.env.get("VAPI_API_KEY");
const VAPI_BASE_URL = "https://api.vapi.ai";

// Function to create official Vapi payload structure
function createOfficialPayload(phoneNumber: string, assistantId?: string, message?: string) {
  const basePayload = {
    type: "outboundPhoneCall",
    customer: {
      number: phoneNumber  // Official structure: customer.number
    }
  };

  if (assistantId) {
    return {
      ...basePayload,
      assistantId,
      assistantOverrides: {
        firstMessage: message || "Olá! Aqui é a Voxemy via Vapi AI. Como posso te ajudar hoje?"
      }
    };
  } else {
    return {
      ...basePayload,
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
          voiceId: "pFZP5JQG7iQjIQuC4Bku"
        }
      }
    };
  }
}

// Function to create fallback payload structure
function createFallbackPayload(phoneNumber: string, assistantId?: string, message?: string) {
  const basePayload = {
    type: "outboundPhoneCall",
    phoneNumber: phoneNumber  // Fallback structure: phoneNumber as direct string
  };

  if (assistantId) {
    return {
      ...basePayload,
      assistantId,
      assistantOverrides: {
        firstMessage: message || "Olá! Aqui é a Voxemy via Vapi AI. Como posso te ajudar hoje?"
      }
    };
  } else {
    return {
      ...basePayload,
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
          voiceId: "pFZP5JQG7iQjIQuC4Bku"
        }
      }
    };
  }
}

// Function to attempt API call with payload
async function attemptVapiCall(payload: any, attempt: string) {
  console.log(`🚀 TENTATIVA ${attempt} (${FUNCTION_VERSION}):`, JSON.stringify(payload, null, 2));
  
  const response = await fetch(`${VAPI_BASE_URL}/call`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${VAPI_API_KEY}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const responseText = await response.text();
  console.log(`📊 RESPOSTA ${attempt} - Status: ${response.status}, Body:`, responseText);

  if (!response.ok) {
    let errorData;
    try {
      errorData = JSON.parse(responseText);
    } catch {
      errorData = { message: responseText };
    }
    
    console.error(`❌ ERRO ${attempt} (${FUNCTION_VERSION}):`, {
      status: response.status,
      statusText: response.statusText,
      errorData,
      sentPayload: payload
    });
    
    throw new Error(`Vapi API error (${attempt}): ${response.status} - ${JSON.stringify(errorData)}`);
  }

  return JSON.parse(responseText);
}

serve(async (req) => {
  // Log function start with timestamp
  console.log(`📞 [${new Date().toISOString()}] Function called - Version: ${FUNCTION_VERSION}`);
  
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

    // Log all received parameters for debugging
    console.log(`📋 Parâmetros recebidos (${FUNCTION_VERSION}):`, {
      phoneNumber: phoneNumber || 'não fornecido',
      agentId: agentId || 'não fornecido',
      campaignId: campaignId || 'não fornecido',
      leadId: leadId || 'não fornecido',
      assistantId: assistantId || 'não fornecido',
      message: message ? 'fornecida' : 'não fornecida'
    });

    // Validate required parameters
    if (!phoneNumber) {
      throw new Error("Número de telefone é obrigatório");
    }

    console.log(`🔄 Iniciando chamada Vapi para: ${phoneNumber} (Version: ${FUNCTION_VERSION})`);

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

    console.log(`📱 Número formatado: ${formattedPhone} (Version: ${FUNCTION_VERSION})`);

    // Check if assistantId is provided and valid
    let validAssistantId = null;
    
    if (assistantId) {
      try {
        console.log(`🤖 Verificando assistantId: ${assistantId} (Version: ${FUNCTION_VERSION})`);
        const assistantCheckResponse = await fetch(`${VAPI_BASE_URL}/assistant/${assistantId}`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${VAPI_API_KEY}`,
            "Content-Type": "application/json"
          }
        });
        
        if (assistantCheckResponse.ok) {
          validAssistantId = assistantId;
          console.log(`✅ AssistantId ${assistantId} é válido (Version: ${FUNCTION_VERSION})`);
        } else {
          console.log(`⚠️ AssistantId ${assistantId} não é válido, usando configuração padrão (Version: ${FUNCTION_VERSION})`);
        }
      } catch (err) {
        console.log(`❌ Erro ao verificar assistantId: ${err.message} (Version: ${FUNCTION_VERSION})`);
      }
    }

    // Try official structure first, then fallback
    let vapiResult;
    let usedStructure = "unknown";

    try {
      // Attempt 1: Official Vapi structure (customer.number)
      console.log(`🎯 TENTATIVA 1: Estrutura oficial da Vapi (customer.number)`);
      const officialPayload = createOfficialPayload(formattedPhone, validAssistantId, message);
      
      // Add optional metadata if available
      const metadata = {};
      if (agentId) metadata.agentId = agentId;
      if (campaignId) metadata.campaignId = campaignId;
      if (leadId) metadata.leadId = leadId;
      
      if (Object.keys(metadata).length > 0) {
        officialPayload.metadata = metadata;
      }

      vapiResult = await attemptVapiCall(officialPayload, "OFICIAL");
      usedStructure = "official-customer-number";
      console.log(`✅ SUCESSO com estrutura oficial! (${FUNCTION_VERSION})`);

    } catch (officialError) {
      console.log(`⚠️ Estrutura oficial falhou, tentando fallback...`);
      
      try {
        // Attempt 2: Fallback structure (phoneNumber as string)
        console.log(`🎯 TENTATIVA 2: Estrutura fallback (phoneNumber como string)`);
        const fallbackPayload = createFallbackPayload(formattedPhone, validAssistantId, message);
        
        // Add optional metadata if available
        const metadata = {};
        if (agentId) metadata.agentId = agentId;
        if (campaignId) metadata.campaignId = campaignId;
        if (leadId) metadata.leadId = leadId;
        
        if (Object.keys(metadata).length > 0) {
          fallbackPayload.metadata = metadata;
        }

        vapiResult = await attemptVapiCall(fallbackPayload, "FALLBACK");
        usedStructure = "fallback-phoneNumber-string";
        console.log(`✅ SUCESSO com estrutura fallback! (${FUNCTION_VERSION})`);

      } catch (fallbackError) {
        console.error(`❌ AMBAS estruturas falharam (${FUNCTION_VERSION}):`);
        console.error(`Erro oficial:`, officialError.message);
        console.error(`Erro fallback:`, fallbackError.message);
        
        throw new Error(`Todas as tentativas falharam. Oficial: ${officialError.message}. Fallback: ${fallbackError.message}`);
      }
    }

    console.log(`✅ Resposta Vapi (sucesso com ${usedStructure}) - ${FUNCTION_VERSION}:`, JSON.stringify(vapiResult, null, 2));

    // Create call log record
    const { data: callLog, error: logError } = await supabase
      .from("call_logs")
      .insert({
        call_sid: vapiResult.id,
        status: "initiated",
        from_number: "+5511999999999",
        to_number: formattedPhone,
        agent_id: agentId || null,
        campaign_id: campaignId || null,
        lead_id: leadId || null,
        conversation_relay_active: false
      })
      .select()
      .single();

    if (logError) {
      console.error(`⚠️ Erro ao criar log da chamada (${FUNCTION_VERSION}):`, logError);
    } else {
      console.log(`📝 Log da chamada criado (${FUNCTION_VERSION}):`, callLog);
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
        console.error(`⚠️ Erro ao atualizar lead (${FUNCTION_VERSION}):`, leadError);
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
        usedAssistantId: validAssistantId,
        usedStructure: usedStructure,
        functionVersion: FUNCTION_VERSION
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );

  } catch (error) {
    console.error(`❌ Erro na função make-vapi-call (${FUNCTION_VERSION}):`, error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro interno do servidor",
        details: error.stack || "Sem detalhes adicionais",
        functionVersion: FUNCTION_VERSION
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" }
      }
    );
  }
});

