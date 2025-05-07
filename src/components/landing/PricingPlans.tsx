
import { Check } from "lucide-react";
import { Button } from "../../components/ui/button";

const PricingPlans = () => {
  const plans = [
    {
      name: "Starter",
      price: "R$97",
      period: "/mês",
      description: "Ideal para pequenas empresas iniciando com IA.",
      features: [
        "2 agentes virtuais",
        "5 horas de voz por mês",
        "WhatsApp incluso",
        "Suporte por email",
        "Integrações básicas"
      ],
      isPopular: false
    },
    {
      name: "Pro",
      price: "R$197",
      period: "/mês",
      description: "Para negócios em crescimento que precisam escalar.",
      features: [
        "5 agentes virtuais",
        "10 horas de voz por mês",
        "WhatsApp e Web Chat",
        "Suporte rápido",
        "Integrações intermediárias"
      ],
      isPopular: true
    },
    {
      name: "Premium",
      price: "R$297",
      period: "/mês",
      description: "Solução completa para empresas estabelecidas.",
      features: [
        "Agentes virtuais ilimitados",
        "20 horas de voz por mês",
        "Todos os canais de comunicação",
        "Suporte prioritário",
        "Integrações premium"
      ],
      isPopular: false
    }
  ];

  return (
    <section id="pricing-plans" className="py-20 bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Escolha o plano ideal para o seu atendimento</h2>
          <p className="text-slate-300">
            Preços transparentes sem surpresas. Cancele quando quiser.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {plans.map((plan, index) => (
            <div 
              key={index} 
              className={`rounded-xl overflow-hidden ${
                plan.isPopular 
                  ? "border-2 border-violet-500 shadow-lg shadow-violet-500/20 relative" 
                  : "border border-slate-700/50"
              }`}
            >
              {plan.isPopular && (
                <div className="absolute top-0 right-0 bg-violet-500 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
                  Mais popular
                </div>
              )}
              
              <div className="bg-slate-800/50 backdrop-blur p-8">
                <h3 className="text-xl font-semibold mb-2">{plan.name}</h3>
                <div className="flex items-end gap-1 mb-4">
                  <span className="text-4xl font-bold">{plan.price}</span>
                  <span className="text-slate-400 mb-1">{plan.period}</span>
                </div>
                <p className="text-slate-400 text-sm mb-6">{plan.description}</p>
                
                <Button 
                  className={`w-full ${
                    plan.isPopular 
                      ? "bg-violet-600 hover:bg-violet-700" 
                      : "bg-slate-700 hover:bg-slate-600"
                  }`}
                  onClick={() => window.location.href = "/login"}
                >
                  Começar com este plano
                </Button>
              </div>
              
              <div className="bg-slate-900/80 p-8">
                <ul className="space-y-4">
                  {plan.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <Check className="text-green-500 shrink-0 mt-0.5" size={18} />
                      <span className="text-slate-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PricingPlans;
