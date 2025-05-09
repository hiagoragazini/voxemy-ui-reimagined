
import { AgentCard, AgentCardSkeleton, AgentCardProps } from "@/components/agents/AgentCard";
import { Plus, AlertCircle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CampaignCallTester } from "@/components/campaign/CampaignCallTester";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

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
  const [showCallTester, setShowCallTester] = useState<string | null>(null);

  const handleStatusChange = (id: string, isActive: boolean) => {
    console.log(`Status do agente ${id} alterado para ${isActive ? 'ativo' : 'inativo'}`);
  };

  const handleCreateClick = () => {
    if (onCreateAgent) {
      onCreateAgent();
    }
  };
  
  const handleTestCall = (agentId: string) => {
    setShowCallTester(agentId);
    if (onTestCall) {
      onTestCall(agentId);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="col-span-full flex justify-center items-center mb-4">
          <div className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
            <span className="text-blue-600 font-medium">Carregando agentes...</span>
          </div>
        </div>
        {Array(3)
          .fill(null)
          .map((_, index) => (
            <AgentCardSkeleton key={index} />
          ))}
      </div>
    );
  }

  // Se não houver agentes, mostre uma mensagem
  if (agents.length === 0) {
    return (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        <div className="col-span-full mb-4">
          <Alert className="bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle>Nenhum agente encontrado</AlertTitle>
            <AlertDescription>
              Não encontramos nenhum agente no sistema. Verifique se criou corretamente o agente ou crie um novo agora mesmo.
            </AlertDescription>
          </Alert>
        </div>
        
        <Card className="border-dashed border-2 border-gray-200 hover:border-blue-800/30 transition-all duration-200 hover:shadow-md hover:scale-[1.01] group cursor-pointer" onClick={handleCreateClick}>
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
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

  const selectedAgent = showCallTester ? 
    processedAgents.find(agent => agent.id === showCallTester) : null;

  return (
    <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {processedAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            {...agent}
            onStatusChange={handleStatusChange}
            onEditClick={onAgentEditClick}
            onTestVoice={onTestVoice}
            onTestCall={() => handleTestCall(agent.id)}
          />
        ))}
        
        <Card className="border-dashed border-2 border-gray-200 hover:border-blue-800/30 transition-all duration-200 hover:shadow-md hover:scale-[1.01] group cursor-pointer" onClick={handleCreateClick}>
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
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

      {/* Dialog for call testing */}
      <Dialog 
        open={showCallTester !== null} 
        onOpenChange={(open) => !open && setShowCallTester(null)}
      >
        <DialogContent className="sm:max-w-[450px]">
          {selectedAgent && (
            <CampaignCallTester
              agentId={selectedAgent.id}
              agentName={selectedAgent.name}
              onClose={() => setShowCallTester(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
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
