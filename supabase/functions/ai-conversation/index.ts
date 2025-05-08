
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      throw new Error("OPENAI_API_KEY não está configurada");
    }

    const { prompt, messages, model, systemPrompt } = await req.json();
    
    // Validate request
    if (!messages && !prompt) {
      throw new Error("Mensagens ou prompt são obrigatórios");
    }

    // Format messages for OpenAI API
    let formattedMessages = [];
    
    if (messages) {
      formattedMessages = messages;
    } else if (prompt) {
      formattedMessages = [
        {
          role: "user",
          content: prompt,
        },
      ];
    }

    // Add system prompt if provided
    if (systemPrompt) {
      formattedMessages.unshift({
        role: "system",
        content: systemPrompt,
      });
    }

    console.log("Enviando requisição para OpenAI...");
    
    // Make the API request to OpenAI
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openAIApiKey}`,
      },
      body: JSON.stringify({
        model: model || "gpt-4o-mini",
        messages: formattedMessages,
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erro na API do OpenAI: ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: aiResponse,
        usage: data.usage,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na função ai-conversation:", error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || "Erro ao processar a solicitação" 
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
