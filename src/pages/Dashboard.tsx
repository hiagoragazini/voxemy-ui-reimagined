import { useNavigate } from "react-router-dom";
import { Layout } from "../components/dashboard/Layout";
import { StatsOverview } from "../components/dashboard/StatsOverview";
import { TopAgentsSection } from "../components/dashboard/TopAgentsSection";
import { NextStepsSection } from "../components/dashboard/NextStepsSection";
export default function Dashboard() {
  const navigate = useNavigate();

  // Navegar para a página de todos os agentes
  const viewAllAgents = () => {
    navigate('/agents');
  };

  // Navegar para a página de criação de agente
  const handleCreateAgent = () => {
    navigate('/agents/new');
  };

  // Navegar para a página de edição de agente
  const handleAgentEditClick = (id: string) => {
    navigate(`/agents/${id}/edit`);
  };
  return <Layout>
      <div className="px-6 py-8 md:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col mb-10">
          <h1 className="text-4xl font-semibold tracking-tighter text-gradient-primard">
            Dashboard
          </h1>
          <p className="mt-2 text-apple-text-secondary text-lg">
            Acompanhe o desempenho do seu sistema de atendimento por voz em tempo real.
          </p>
        </div>
        
        {/* Estatísticas do topo */}
        <StatsOverview />

        {/* Top agentes */}
        <TopAgentsSection onViewAllClick={viewAllAgents} onCreateAgentClick={handleCreateAgent} onAgentEditClick={handleAgentEditClick} />

        {/* Próximos passos */}
        <NextStepsSection />
      </div>
    </Layout>;
}