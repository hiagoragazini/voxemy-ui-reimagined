
import { AgentCard, AgentCardSkeleton, AgentCardProps } from "@/components/agents/AgentCard";
import { Plus, AlertCircle, Loader2, RefreshCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
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
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export const AgentGrid = ({ 
  agents, 
  isLoading = false,
  isRefreshing = false,
  onAgentEditClick,
  onTestVoice,
  onCreateAgent,
  onTestCall,
  onRefresh
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
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  // Process agents with stable voice usage data - only compute this once when agents change
  const processedAgents = useMemo(() => {
    console.log("Processando agentes para exibição:", agents.length);
    
    return agents.map((agent) => {
      // Only add voiceUsage if it doesn't exist
      if (!agent.voiceUsage) {
        // Generate deterministic "random" based on agent ID to ensure stability
        const seed = Array.from(agent.id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        return {
          ...agent,
          voiceUsage: {
            current: 1 + (seed % 8),  // Between 1-8
            total: 10
          }
        };
      }
      return agent;
    });
  }, [agents]); // Recompute only when agents array reference changes

  // Find selected agent for call testing
  const selectedAgent = useMemo(() => {
    if (!showCallTester) return null;
    return processedAgents.find(agent => agent.id === showCallTester);
  }, [showCallTester, processedAgents]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-7">
        <div className="col-span-full flex justify-center items-center mb-6">
          <div className="flex items-center gap-2 bg-secondary/50 px-4 py-2 rounded-lg">
            <Loader2 className="h-5 w-5 text-primary-apple animate-spin" />
            <span className="text-apple-text-primary font-medium">Carregando agentes...</span>
          </div>
        </div>
        {Array(6)
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5">
        <div className="col-span-full mb-6">
          <Alert className="bg-amber-50/70 text-amber-800 border-amber-200 rounded-xl">
            <AlertCircle className="h-5 w-5" />
            <AlertTitle className="text-base font-medium">Nenhum agente encontrado</AlertTitle>
            <AlertDescription className="text-amber-700">
              Não encontramos nenhum agente no sistema. Verifique se criou corretamente o agente ou crie um novo agora mesmo.
            </AlertDescription>
          </Alert>
          
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="mt-4 w-full rounded-xl py-6 border-dashed border-2 hover:border-primary-apple/30 hover:bg-secondary/50 transition-all duration-200"
            disabled={isRefreshing}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Verificar Agentes no Banco de Dados
          </Button>
        </div>
        
        <Card className="border-dashed border-2 border-gray-200 hover:border-primary-apple/30 transition-all duration-200 hover:shadow-apple-hover hover:scale-[1.01] group cursor-pointer rounded-xl" onClick={handleCreateClick}>
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-primary-apple/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-apple/20 transition-colors">
              <Plus className="h-8 w-8 text-primary-apple group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-lg font-medium mb-2 group-hover:text-primary-apple transition-colors">Criar Novo Agente</h3>
            <p className="text-apple-text-secondary text-sm">
              Configure um novo assistente de voz para suas chamadas
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // For debugging - don't reallocate on each render
  console.log("Renderizando grid com agentes:", processedAgents.length);

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          className="rounded-lg"
          disabled={isRefreshing}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 4xl:grid-cols-7">
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
        
        <Card className="border-dashed border-2 border-gray-200 hover:border-primary-apple/30 transition-all duration-200 hover:shadow-apple-hover hover:scale-[1.01] group cursor-pointer rounded-xl" onClick={handleCreateClick}>
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-16 h-16 bg-primary-apple/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-apple/20 transition-colors">
              <Plus className="h-8 w-8 text-primary-apple group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="text-lg font-medium mb-2 group-hover:text-primary-apple transition-colors">Criar Novo Agente</h3>
            <p className="text-apple-text-secondary text-sm">
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
              agentVoiceId={selectedAgent.voiceId}
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
