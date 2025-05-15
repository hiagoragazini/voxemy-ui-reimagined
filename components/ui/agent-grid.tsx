"use client";

import { AgentCard, AgentCardSkeleton, AgentCardProps } from "@/components/ui/agent-card";
import { Plus, AlertCircle, Loader2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CampaignCallTester } from "@/components/campaign/CampaignCallTester";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

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
  const router = useRouter();
  const [showCallTester, setShowCallTester] = useState<string | null>(null);
  const [localAgents, setLocalAgents] = useState<AgentCardProps[]>(agents);

  // Sync local state with props
  useEffect(() => {
    if (agents && agents.length > 0) {
      console.log("Agents received in agent-grid:", agents);
      setLocalAgents(agents);
    }
  }, [agents]);

  // Direct data check from DB if no agents received
  useEffect(() => {
    const checkAgentsDirectly = async () => {
      if (!agents || agents.length === 0) {
        try {
          console.log("No agents found in props, checking database directly...");
          const { data, error } = await supabase
            .from('agents')
            .select('*');
            
          if (error) {
            console.error("Error fetching agents directly:", error);
          } else if (data && data.length > 0) {
            console.log("Found agents directly from DB:", data);
            toast.info(`${data.length} agente(s) encontrado(s) diretamente do banco`);
            
            // Transform agents to expected format
            const formattedAgents = data.map(agent => ({
              id: agent.id,
              name: agent.name,
              category: agent.category || 'Geral',
              description: agent.description || "",
              status: agent.status as "active" | "paused" | "inactive" || "active",
              calls: 0,
              avgTime: "0:00",
              successRate: 0,
              successChange: "+0.0%",
              lastActivity: "Hoje",
              avatarLetter: agent.name.charAt(0),
              avatarColor: getAvatarColor(agent.name),
              voiceId: agent.voice_id
            }));
            
            setLocalAgents(formattedAgents);
          }
        } catch (err) {
          console.error("Error in direct agent check:", err);
        }
      }
    };
    
    checkAgentsDirectly();
  }, [agents]);

  const handleStatusChange = (id: string, isActive: boolean) => {
    console.log(`Status do agente ${id} alterado para ${isActive ? 'ativo' : 'inativo'}`);
  };

  const handleCreateClick = () => {
    if (onCreateAgent) {
      onCreateAgent();
    } else {
      router.push('/agentes/novo');
    }
  };

  const handleTestCall = (agentId: string) => {
    setShowCallTester(agentId);
    if (onTestCall) {
      onTestCall(agentId);
    }
  };
  
  const handleEditClick = (id: string) => {
    if (onAgentEditClick) {
      onAgentEditClick(id);
    } else {
      router.push(`/agentes/${id}/editar`);
    }
  };
  
  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    } else {
      toast.info("Atualizando agentes...");
      // If no refresh handler provided, fetch directly
      const fetchDirectly = async () => {
        try {
          const { data, error } = await supabase
            .from('agents')
            .select('*');
            
          if (error) {
            console.error("Error refreshing agents:", error);
            toast.error("Erro ao atualizar agentes");
          } else if (data && data.length > 0) {
            console.log("Agents refreshed directly:", data);
            toast.success(`${data.length} agente(s) atualizado(s)`);
            
            // Transform agents to expected format
            const formattedAgents = data.map(agent => ({
              id: agent.id,
              name: agent.name,
              category: agent.category || 'Geral',
              description: agent.description || "",
              status: agent.status as "active" | "paused" | "inactive" || "active",
              calls: 0,
              avgTime: "0:00",
              successRate: 0,
              successChange: "+0.0%",
              lastActivity: "Hoje",
              avatarLetter: agent.name.charAt(0),
              avatarColor: getAvatarColor(agent.name),
              voiceId: agent.voice_id
            }));
            
            setLocalAgents(formattedAgents);
          } else {
            toast.warning("Nenhum agente encontrado");
          }
        } catch (err) {
          console.error("Error in refresh:", err);
          toast.error("Falha ao atualizar agentes");
        }
      };
      
      fetchDirectly();
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
  if (!localAgents || localAgents.length === 0) {
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
          
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="mt-4 w-full"
            disabled={isRefreshing}
          >
            <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Verificar Agentes no Banco de Dados
          </Button>
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
  const processedAgents = localAgents.map((agent) => ({
    ...agent,
    voiceUsage: agent.voiceUsage || {
      current: Math.floor(Math.random() * 8) + 1,
      total: 10
    }
  }));

  const selectedAgent = showCallTester ? 
    processedAgents.find(agent => agent.id === showCallTester) : null;

  return (
    <>
      <div className="flex justify-end mb-4">
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isRefreshing}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Atualizar Lista
        </Button>
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
        {processedAgents.map((agent) => (
          <AgentCard
            key={agent.id}
            {...agent}
            onStatusChange={handleStatusChange}
            onEditClick={handleEditClick}
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
    "bg-blue-100", "bg-sky-100", "bg-cyan-100", 
    "bg-teal-100", "bg-blue-100", "bg-sky-100",
    "bg-cyan-100", "bg-teal-100", "bg-blue-100"
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};
