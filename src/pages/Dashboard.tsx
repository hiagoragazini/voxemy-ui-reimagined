
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
      <Header />
      <div className="py-6">
        <StatsOverview />
        
        <div className="grid md:grid-cols-2 gap-6 mt-6">
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
