
"use client";

const HowItWorks = () => {
  const steps = [
    {
      number: "01",
      title: "Crie seu agente",
      description: "Configure seu assistente de voz em minutos, escolhendo entre vozes masculinas e femininas."
    },
    {
      number: "02",
      title: "Treine com o que quiser",
      description: "Faça upload de documentos, conhecimentos específicos ou scripts de atendimento."
    },
    {
      number: "03",
      title: "Atenda com voz automatizada",
      description: "Deixe o agente cuidar dos atendimentos enquanto você foca no crescimento."
    }
  ];

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold mb-4">Como funciona</h2>
          <p className="text-slate-300">
            Três passos simples para transformar seu atendimento com inteligência artificial
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12">
          {steps.map((step, index) => (
            <div 
              key={index} 
              className="relative"
            >
              <div className="bg-slate-800/30 rounded-xl p-8 border border-slate-700/50 h-full flex flex-col">
                <span className="text-5xl font-bold text-slate-700 mb-6">{step.number}</span>
                <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                <p className="text-slate-400 mt-auto">{step.description}</p>
              </div>
              
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 z-10">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
