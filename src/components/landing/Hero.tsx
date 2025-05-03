
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <section className="pt-32 pb-20 px-4 md:pt-40 md:pb-28">
      <div className="container mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight">
                Atendentes de Voz com IA.
                <span className="bg-gradient-to-r from-blue-400 to-violet-500 bg-clip-text text-transparent block mt-2">
                  Para vendas e suporte.
                </span>
              </h1>
              <p className="text-xl text-slate-300 max-w-lg">
                Automatize conversas com clientes e economize horas por dia com agentes de voz inteligentes.
              </p>
            </div>
            
            <div>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-violet-600 hover:from-blue-600 hover:to-violet-700 text-white shadow-lg hover:shadow-violet-500/50 transition-all"
                onClick={() => window.location.href = "/login"}
              >
                Quero criar meu agente
              </Button>
              <p className="text-sm text-slate-400 mt-3">
                Configure em minutos. Sem cartão de crédito.
              </p>
            </div>
          </div>
          
          <div className="relative">
            <div className="bg-gradient-to-tr from-blue-600/20 to-violet-600/20 rounded-2xl p-1">
              <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-800 flex items-center justify-center">
                <div className="text-slate-500 p-8">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="64"
                    height="64"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="mx-auto mb-4"
                  >
                    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path>
                  </svg>
                  <p className="text-center">Ilustração da plataforma</p>
                </div>
              </div>
            </div>
            
            <div className="absolute -z-10 inset-0 bg-gradient-to-tr from-blue-500/20 to-violet-500/20 blur-3xl rounded-full transform translate-x-10 translate-y-10"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
