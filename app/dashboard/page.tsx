
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/ui/layout";
import { useAgents } from "@/hooks/use-agents";
import { StatsOverview } from "@/components/dashboard/StatsOverview";
import { TopAgentsSection } from "@/components/dashboard/TopAgentsSection";
import { NextStepsSection } from "@/components/dashboard/NextStepsSection";

export default function DashboardPage() {
  const router = useRouter();
  const { 
    agents, 
    isLoading, 
    isRefreshing,
    handleManualRefresh 
  } = useAgents();

  // Get top agents for dashboard display - use the same agents data from the Agents page
  const topAgents = agents.slice(0, 2);

  // Navegar para a página de todos os agentes
  const viewAllAgents = () => {
    router.push('/agentes');
  };

  // Navegar para a página de criação de agente
  const handleCreateAgent = () => {
    console.log("Redirecionando para criação de novo agente...");
    router.push('/agentes/novo');
  };

  // Navegar para a página de edição de agente
  const handleAgentEditClick = (id: string) => {
    router.push(`/agentes/${id}/editar`);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-semibold text-gray-900">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Acompanhe o desempenho do seu sistema de atendimento por voz em tempo real.
          </p>
        </div>
        
        {/* Estatísticas do topo */}
        <StatsOverview />

        {/* Top agentes */}
        <TopAgentsSection 
          agents={topAgents}
          isLoading={isLoading}
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
