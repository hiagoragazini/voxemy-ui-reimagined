import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { AgentFilters } from "@/components/agents/AgentFilters";
import { AgentDiagnosticsAlert } from "@/components/agents/AgentDiagnosticsAlert";
import { useAgents } from "@/hooks/use-agents";
import { useAgentDiagnostics } from "@/hooks/use-agent-diagnostics";
import { Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { AgentTester } from "@/components/agents/AgentTester";

export default function Agents() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "inactive">("all");
  const [typeFilter, setTypeFilter] = useState<"all" | "text" | "voice" | "hybrid">("all");
  const [hasRun, setHasRun] = useState(false);
  const [selectedAgentForTest, setSelectedAgentForTest] = useState<{
    id: string, 
    name: string, 
    type: "text" | "voice" | "hybrid",
    voiceId?: string
  } | null>(null);
  
  // Chamadas diretas dos hooks sem fallbacks condicionais
  const { 
    agents, 
    isLoading, 
    isRefreshing, 
    refetch,
    handleManualRefresh, 
    showDiagnosticsAlert, 
    setShowDiagnosticsAlert,
    forceRefresh,
    createDemoAgent,
    isCreatingDemoAgent 
  } = useAgents();
  
  const { isDiagnosing, handleDiagnose } = useAgentDiagnostics(refetch);
  
  // Check if we're coming from agent creation or edit - verificamos apenas UMA vez no carregamento
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const agentCreated = params.get('created');
    const agentUpdated = params.get('updated');
    const agentId = params.get('id');
    
    if (agentCreated === 'true') {
      toast.success("Agente criado com sucesso! Atualizando a lista...");
      
      // Verificação direta no banco se o agente foi criado
      if (agentId) {
        console.log("Verificando se o agente realmente foi criado com ID:", agentId);
        const checkAgent = async () => {
          try {
            const { data, error } = await supabase
              .from('agents')
              .select('*')
              .eq('id', agentId)
              .single();
              
            if (error) {
              console.error("Erro ao verificar agente recém-criado:", error);
            } else if (data) {
              console.log("Agente encontrado no banco:", data);
              toast.success(`Agente "${data.name}" encontrado no banco de dados!`);
              
              // Força recarregar os dados após confirmação
              forceRefresh();
            }
          } catch (err) {
            console.error("Erro na verificação do agente:", err);
          }
        };
        
        checkAgent();
      }
      
      // Invalidate query cache to force a refresh
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      
      // Clean up URL params
      navigate('/agents', { replace: true });
    } else if (agentUpdated === 'true') {
      toast.success("Agente atualizado com sucesso! Atualizando a lista...");
      
      // Invalidate query cache and refresh
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      forceRefresh();
      
      // Clean up URL params
      navigate('/agents', { replace: true });
    }
  }, [location.search, navigate, queryClient, forceRefresh]); // Add required dependencies
  
  const handleCreateAgent = () => {
    navigate("/agents/new");
  };

  const handleCreateDemoAgent = () => {
    createDemoAgent();
  };

  const handleTestVoice = (id: string) => {
    const agent = agents.find(a => a.id === id);
    if (agent) {
      setSelectedAgentForTest({
        id: agent.id,
        name: agent.name,
        type: "voice",
        voiceId: agent.voiceId
      });
    }
  };

  const handleTestCall = (id: string) => {
    const agent = agents.find(a => a.id === id);
    if (agent) {
      setSelectedAgentForTest({
        id: agent.id,
        name: agent.name,
        type: agent.type || "voice",
        voiceId: agent.voiceId
      });
    }
  };

  const handleEditAgent = (id: string) => {
    navigate(`/agents/${id}/edit`);
  };

  // Filter agents based on selected filters (status AND type)
  const filteredAgents = agents.filter(agent => {
    const statusMatch = filter === "all" || agent.status === filter;
    const typeMatch = typeFilter === "all" || agent.type === typeFilter;
    return statusMatch && typeMatch;
  });

  // Verificação inicial - executada apenas uma vez
  useEffect(() => {
    // Evitar múltiplas verificações iniciais
    if (hasRun) return;
    
    console.log("Agent component mounted, verificando agentes...");
    setHasRun(true);
    
    // Verificação direta no banco se existem agentes
    const initialCheck = async () => {
      try {
        // Verificar diretamente no banco se existem agentes
        const { data: directAgentsData } = await supabase
          .from('agents')
          .select('*');
          
        if (directAgentsData && directAgentsData.length > 0) {
          console.log(`Verificação direta encontrou ${directAgentsData.length} agentes:`, 
            directAgentsData.map(a => a.name).join(', '));
            
          // Força um refresh do React Query
          queryClient.invalidateQueries({ queryKey: ['agents'] });
          forceRefresh();
        } else if (!isCreatingDemoAgent) {
          // Se não encontrou agentes, vamos criar um demo
          console.log("Nenhum agente encontrado, criando agente demo...");
          createDemoAgent();
        }
      } catch (err) {
        console.error("Erro na verificação inicial de agentes:", err);
      }
    };
    
    initialCheck();
  }, [hasRun, isCreatingDemoAgent, createDemoAgent, queryClient, forceRefresh]); // Add required dependencies

  return (
    <Layout>
      <div className="px-6 py-8 md:px-8 lg:px-12 xl:px-16">
        <div className="flex flex-col mb-10">
          <h1 className="text-4xl font-bold text-blue-700">
            Seus Agentes
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Gerencie sua equipe de assistentes virtuais e configure-os para diferentes campanhas.
          </p>
        </div>

        {showDiagnosticsAlert && (
          <AgentDiagnosticsAlert
            onDiagnose={handleDiagnose}
            isDiagnosing={isDiagnosing}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
          />
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
          <AgentFilters
            filter={filter}
            setFilter={setFilter}
            typeFilter={typeFilter}
            setTypeFilter={setTypeFilter}
            agents={agents}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
            onDiagnose={handleDiagnose}
            isDiagnosing={isDiagnosing}
          />
          
          <div className="flex gap-3">
            <Button
              onClick={handleCreateDemoAgent}
              className="bg-apple-success hover:bg-apple-success/90 text-white font-medium flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Criar Agente Demo
            </Button>
            
            <Button 
              onClick={handleCreateAgent}
              className="bg-primary-apple hover:bg-primary-apple-light text-white font-medium flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Criar Novo Agente
            </Button>
          </div>
        </div>

        <AgentGrid 
          agents={filteredAgents}
          isLoading={isLoading || isRefreshing} 
          isRefreshing={isRefreshing}
          onAgentEditClick={handleEditAgent}
          onTestVoice={handleTestVoice}
          onCreateAgent={handleCreateAgent}
          onTestCall={handleTestCall}
          onRefresh={handleManualRefresh}
        />
      </div>
      
      {/* Dialog for agent testing */}
      <Dialog
        open={!!selectedAgentForTest}
        onOpenChange={(open) => !open && setSelectedAgentForTest(null)}
      >
        <DialogContent className="sm:max-w-[450px]">
          {selectedAgentForTest && (
            <AgentTester
              agentId={selectedAgentForTest.id}
              agentName={selectedAgentForTest.name}
              agentType={selectedAgentForTest.type}
              voiceId={selectedAgentForTest.voiceId}
              onClose={() => setSelectedAgentForTest(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </Layout>
  );
}
