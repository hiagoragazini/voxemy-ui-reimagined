
import { Users, MessageSquare, Calendar, Star } from "lucide-react";

const Benefits = () => {
  const benefits = [
    {
      icon: <Users className="w-8 h-8" />,
      title: "Escala o atendimento sem contratar mais gente",
      description: "Reduza custos operacionais enquanto mantém alta qualidade nos atendimentos."
    },
    {
      icon: <MessageSquare className="w-8 h-8" />,
      title: "Responde clientes via WhatsApp ou Web",
      description: "Integre com os canais que seus clientes já utilizam para comunicação."
    },
    {
      icon: <Calendar className="w-8 h-8" />,
      title: "Fala com voz natural e personalizada",
      description: "Vozes com emoção e entonação natural que engajam seus clientes."
    },
    {
      icon: <Star className="w-8 h-8" />,
      title: "Aprende com cada interação",
      description: "Inteligência artificial que evolui para melhorar o atendimento continuamente."
    }
  ];

  return (
    <section className="py-20 bg-slate-900/50">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Benefícios que transformam seu atendimento</h2>
          <p className="text-slate-300">
            Ferramentas que ajudam seu negócio a crescer enquanto você foca no que realmente importa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-6 hover:border-violet-500/50 hover:shadow-lg hover:shadow-violet-500/10 transition-all duration-300 group"
            >
              <div className="bg-gradient-to-br from-blue-500/20 to-violet-500/20 p-3 rounded-lg w-fit mb-5 group-hover:from-blue-500/30 group-hover:to-violet-500/30 transition-all">
                <div className="text-blue-400 group-hover:text-blue-300 transition-colors">
                  {benefit.icon}
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{benefit.title}</h3>
              <p className="text-slate-400">{benefit.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Benefits;
