
import React from "react";
import { Button } from "@/components/ui/button";
import { Plus, ArrowRight } from "lucide-react";
import { AgentCardProps } from "@/components/agents/AgentCard";
import { AgentSummaryCard } from "./AgentSummaryCard";
import { Card } from "@/components/ui/card";
import { useAgents } from "@/hooks/use-agents";

interface TopAgentsSectionProps {
  onViewAllClick: () => void;
  onCreateAgentClick: () => void;
  onAgentEditClick: (id: string) => void;
}

export function TopAgentsSection({
  onViewAllClick,
  onCreateAgentClick,
  onAgentEditClick,
}: TopAgentsSectionProps) {
  // Usar o hook useAgents para obter os mesmos dados da página de Agentes
  const { agents = [], isLoading = false } = useAgents() || {};
  
  // Pegar apenas os 2 primeiros agentes para exibir
  const topAgents = agents.slice(0, 2);

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
            Agentes Mais Ativos
          </h2>
          <p className="text-sm text-muted-foreground">
            Agentes com maior volume de chamadas nas últimas 24 horas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onViewAllClick}
            className="flex items-center gap-1 text-sm"
          >
            Ver Todos
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>

          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
            onClick={onCreateAgentClick}
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Agente
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {isLoading ? (
          <p>Carregando agentes...</p>
        ) : topAgents.length > 0 ? (
          topAgents.map((agent) => (
            <AgentSummaryCard
              key={agent.id}
              agent={agent}
              onClick={onAgentEditClick}
            />
          ))
        ) : (
          <Card className="col-span-2 p-8 text-center">
            <p className="mb-4 text-muted-foreground">
              Nenhum agente encontrado. Crie seu primeiro agente para começar.
            </p>
            <Button
              onClick={onCreateAgentClick}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar Novo Agente
            </Button>
          </Card>
        )}
      </div>
    </>
  );
}
