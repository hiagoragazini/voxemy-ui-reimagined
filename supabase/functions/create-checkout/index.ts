
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@14.21.0";
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
    // Inicializar cliente Supabase usando a chave anônima para autenticação do usuário
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    // Verificar autenticação do usuário
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseClient.auth.getUser(token);
    const user = data.user;
    if (!user?.email) throw new Error("Usuário não autenticado ou email não disponível");

    // Obter o tipo de plano da requisição (basic, pro ou enterprise)
    const { planType } = await req.json();
    if (!planType) throw new Error("Tipo de plano não especificado");

    // Inicializar Stripe com a chave secreta
    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2023-10-16",
    });

    // Verificar se já existe um cliente Stripe para este usuário
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId;
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
    } else {
      // Criar um novo cliente Stripe se não existir
      const newCustomer = await stripe.customers.create({
        email: user.email,
        name: user.user_metadata?.full_name || user.email,
      });
      customerId = newCustomer.id;
    }

    // Configurar os preços de acordo com o tipo de plano
    let priceId;
    let amount;
    let productName;
    
    switch (planType) {
      case 'basic':
        amount = 9900; // R$ 99,00
        productName = "Plano Inicial";
        break;
      case 'pro':
        amount = 19900; // R$ 199,00
        productName = "Plano Pro";
        break;
      case 'enterprise':
        amount = 39900; // R$ 399,00
        productName = "Plano Enterprise";
        break;
      default:
        throw new Error("Tipo de plano inválido");
    }

    // Criar uma sessão de checkout do Stripe
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      line_items: [
        {
          price_data: {
            currency: "brl",
            product_data: { name: productName },
            unit_amount: amount,
            recurring: { interval: "month" },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${req.headers.get("origin")}/settings?checkout_success=true`,
      cancel_url: `${req.headers.get("origin")}/settings?checkout_canceled=true`,
    });

    // Retornar a URL da sessão de checkout
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    // Tratar erros e retornar uma mensagem apropriada
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Erro na função create-checkout: ${errorMessage}`);
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
