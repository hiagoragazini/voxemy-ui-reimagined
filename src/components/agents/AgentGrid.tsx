
import { AgentCard, AgentCardSkeleton, AgentCardProps } from "./AgentCard";
import { toast } from "@/components/ui/sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface AgentGridProps {
  agents: AgentCardProps[];
  isLoading?: boolean;
  onAgentEditClick?: (id: string) => void;
  onTestVoice?: (id: string) => void;
  onCreateAgent?: () => void;
}

export const AgentGrid = ({ 
  agents, 
  isLoading = false, 
  onAgentEditClick,
  onTestVoice,
  onCreateAgent
}: AgentGridProps) => {
  const handleStatusChange = (id: string, isActive: boolean) => {
    toast.success(`Status do agente ${id} alterado para ${isActive ? 'ativo' : 'inativo'}`);
    // Aqui você implementaria a lógica real para atualizar o status do agente
  };

  const handleTestVoice = (id: string) => {
    if (onTestVoice) {
      onTestVoice(id);
    } else {
      toast.success(`Teste de voz iniciado para o agente ${id}`);
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

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          {...agent}
          onStatusChange={handleStatusChange}
          onEditClick={onAgentEditClick}
          onTestVoice={handleTestVoice}
        />
      ))}
      
      {/* Create agent card */}
      <Card className="border-dashed border-2 border-gray-200 hover:border-primary/30 transition-all duration-200">
        <div className="flex flex-col items-center justify-center h-full p-8 text-center cursor-pointer" onClick={onCreateAgent}>
          <div className="w-16 h-16 bg-violet-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="h-8 w-8 text-violet-600" />
          </div>
          <h3 className="text-lg font-medium mb-2">Criar Novo Agente</h3>
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
    "bg-blue-100", "bg-purple-100", "bg-green-100", 
    "bg-yellow-100", "bg-red-100", "bg-pink-100",
    "bg-indigo-100", "bg-orange-100", "bg-violet-100"
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};
