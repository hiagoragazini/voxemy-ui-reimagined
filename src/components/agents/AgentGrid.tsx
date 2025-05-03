
import { AgentCard, AgentCardSkeleton, AgentCardProps } from "./AgentCard";
import { toast } from "@/components/ui/sonner";

interface AgentGridProps {
  agents: AgentCardProps[];
  isLoading?: boolean;
  onAgentEditClick?: (id: string) => void;
}

export const AgentGrid = ({ agents, isLoading = false, onAgentEditClick }: AgentGridProps) => {
  const handleStatusChange = (id: string, isActive: boolean) => {
    toast.success(`Status do agente ${id} alterado para ${isActive ? 'ativo' : 'inativo'}`);
    // Aqui você implementaria a lógica real para atualizar o status do agente
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array(6)
          .fill(null)
          .map((_, index) => (
            <AgentCardSkeleton key={index} />
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          {...agent}
          onStatusChange={handleStatusChange}
          onEditClick={onAgentEditClick}
          avatarLetter={agent.name.charAt(0).toUpperCase()}
          avatarColor={getAvatarColor(agent.name)}
        />
      ))}
    </div>
  );
};

// Função para gerar cores de avatar baseadas no nome
const getAvatarColor = (name: string) => {
  const colors = [
    "bg-blue-100", "bg-purple-100", "bg-green-100", 
    "bg-yellow-100", "bg-red-100", "bg-pink-100",
    "bg-indigo-100", "bg-orange-100"
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};
