
"use client";

import { AgentCard, AgentCardSkeleton, AgentCardProps } from "@/components/ui/agent-card";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";

interface AgentGridProps {
  agents: AgentCardProps[];
  isLoading?: boolean;
  onAgentEditClick?: (id: string) => void;
  onTestVoice?: (id: string) => void;
  onCreateAgent?: () => void;
  onTestCall?: (id: string) => void;
}

export const AgentGrid = ({ 
  agents, 
  isLoading = false, 
  onAgentEditClick,
  onTestVoice,
  onCreateAgent,
  onTestCall
}: AgentGridProps) => {
  const router = useRouter();

  const handleStatusChange = (id: string, isActive: boolean) => {
    // Aqui seria implementada a lógica real para atualizar o status
    console.log(`Status do agente ${id} alterado para ${isActive ? 'ativo' : 'inativo'}`);
  };

  const handleCreateClick = () => {
    if (onCreateAgent) {
      onCreateAgent();
    } else {
      router.push('/agentes/novo');
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array(3)
          .fill(null)
          .map((_, index) => (
            <AgentCardSkeleton key={index} />
          ))}
      </div>
    );
  }

  // Se não houver agentes, mostre apenas o card de criação
  if (agents.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <Card className="border-dashed border-2 border-gray-200 hover:border-blue-800/30 transition-all duration-200 hover:shadow-md hover:scale-[1.01] group">
          <div className="flex flex-col items-center justify-center h-full p-8 text-center cursor-pointer" onClick={handleCreateClick}>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
              <Plus className="h-8 w-8 text-blue-800 group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-lg font-medium mb-2 group-hover:text-blue-800 transition-colors">Criar Novo Agente</h3>
            <p className="text-muted-foreground text-sm">
              Configure um novo assistente de voz para suas chamadas
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Process agent data for display
  const processedAgents = agents.map((agent) => ({
    ...agent,
    voiceUsage: {
      current: Math.floor(Math.random() * 8) + 1,
      total: 10
    }
  }));

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {processedAgents.map((agent) => (
        <AgentCard
          key={agent.id}
          {...agent}
          onStatusChange={handleStatusChange}
          onEditClick={onAgentEditClick}
          onTestVoice={onTestVoice}
          onTestCall={onTestCall}
        />
      ))}
      
      {/* Create agent card with improved visuals - Updated to blue */}
      <Card className="border-dashed border-2 border-gray-200 hover:border-blue-800/30 transition-all duration-200 hover:shadow-md hover:scale-[1.01] group">
        <div className="flex flex-col items-center justify-center h-full p-8 text-center cursor-pointer" onClick={handleCreateClick}>
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-200 transition-colors">
            <Plus className="h-8 w-8 text-blue-800 group-hover:scale-110 transition-transform" />
          </div>
          <h3 className="text-lg font-medium mb-2 group-hover:text-blue-800 transition-colors">Criar Novo Agente</h3>
          <p className="text-muted-foreground text-sm">
            Configure um novo assistente de voz para suas chamadas
          </p>
        </div>
      </Card>
    </div>
  );
};

// Função para gerar cores de avatar baseadas no nome
export const getAvatarColor = (name: string) => {
  const colors = [
    "bg-blue-100", "bg-blue-100", "bg-green-100", 
    "bg-yellow-100", "bg-red-100", "bg-blue-100",
    "bg-indigo-100", "bg-orange-100", "bg-blue-100"
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};
