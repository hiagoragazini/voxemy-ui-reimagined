
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array(8)
          .fill(null)
          .map((_, index) => (
            <AgentCardSkeleton key={index} />
          ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {agents.map((agent) => (
        <AgentCard
          key={agent.id}
          {...agent}
          onStatusChange={handleStatusChange}
          onEditClick={onAgentEditClick}
        />
      ))}
    </div>
  );
};
