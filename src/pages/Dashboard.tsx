
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "../components/dashboard/Layout";
import { StatsOverview } from "../components/dashboard/StatsOverview";
import { TopAgentsSection } from "../components/dashboard/TopAgentsSection";
import { NextStepsSection } from "../components/dashboard/NextStepsSection";
import { useAgents } from "../hooks/use-agents";
import { Button } from "@/components/ui/button";
import { PhoneCall } from "lucide-react";

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
    // Corrigir a rota para /agents/:id/edit em vez de /agents/:id/editar
    navigate(`/agents/${id}/edit`);
  };

  // Navegar para a página de teste de ConversationRelay
  const handleConversationRelayTest = () => {
    navigate('/conversation-relay-test');
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Acompanhe o desempenho do seu sistema de atendimento por voz em tempo real.
          </p>
        </div>
        
        {/* Botão para teste de ConversationRelay */}
        <div className="mb-6">
          <Button 
            onClick={handleConversationRelayTest}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <PhoneCall className="mr-2 h-4 w-4" />
            Testar ConversationRelay
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            Experimente a nova funcionalidade de conversação em tempo real com Twilio ConversationRelay.
          </p>
        </div>
        
        {/* Estatísticas do topo */}
        <StatsOverview />

        {/* Top agentes */}
        <TopAgentsSection 
          onViewAllClick={viewAllAgents}
          onCreateAgentClick={handleCreateAgent}
          onAgentEditClick={handleAgentEditClick}
        />

        {/* Próximos passos */}
        <NextStepsSection />
      </div>
    </Layout>
  );
}
