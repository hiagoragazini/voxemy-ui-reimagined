
import { Button } from "../../components/ui/button";

const Hero = () => {
  const scrollToPlans = () => {
    const plansSection = document.getElementById('pricing-plans');
    plansSection?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="pt-32 pb-20 px-4 md:pt-40 md:pb-28">
      <div className="container mx-auto">
        <div className="text-center max-w-3xl mx-auto">
          <div className="space-y-4 mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
              Atendentes de Voz com IA.
              <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent block mt-2">
                Para vendas e suporte.
              </span>
            </h1>
            <p className="text-xl text-slate-300 max-w-lg mx-auto">
              Automatize conversas com clientes e economize horas por dia com agentes de voz inteligentes.
            </p>
          </div>
          
          <div>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white shadow-lg hover:shadow-violet-500/50 transition-all"
              onClick={scrollToPlans}
            >
              Testar 7 dias grátis
            </Button>
            <p className="text-sm text-slate-400 mt-3">
              Configure em minutos. Cancele quando quiser.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
