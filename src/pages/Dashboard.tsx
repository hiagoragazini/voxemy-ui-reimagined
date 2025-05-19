
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { TopAgentsSection } from "@/components/dashboard/TopAgentsSection";
import { NextStepsSection } from "@/components/dashboard/NextStepsSection";
import { Header } from "@/components/dashboard/Header";
import { Layout } from "@/components/dashboard/Layout";
import { useNavigate } from "react-router-dom";

export default function Dashboard() {
  const navigate = useNavigate();

  // Handler functions for TopAgentsSection
  const handleViewAllAgents = () => {
    navigate('/agents');
  };

  const handleCreateAgent = () => {
    navigate('/agents/new');
  };

  const handleEditAgent = (id: string) => {
    navigate(`/agents/${id}/edit`);
  };

  return (
    <Layout>
      <div className="py-6 px-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-blue-800">Dashboard</h1>
          <p className="text-sm text-gray-500">Visão geral do seu sistema de atendimento por voz</p>
        </div>
        
        <StatsOverview />
        
        <div className="grid md:grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <NextStepsSection />
        </div>
        
        <div className="mt-6">
          <TopAgentsSection 
            onViewAllClick={handleViewAllAgents}
            onCreateAgentClick={handleCreateAgent}
            onAgentEditClick={handleEditAgent}
          />
        </div>
      </div>
    </Layout>
  );
}
