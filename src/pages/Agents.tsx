
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { AgentFilters } from "@/components/agents/AgentFilters";
import { AgentDiagnosticsAlert } from "@/components/agents/AgentDiagnosticsAlert";
import { useAgents } from "@/hooks/use-agents";
import { useAgentDiagnostics } from "@/hooks/use-agent-diagnostics";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { verifyAgentCreation, forceRefreshAgents } from "@/utils/dbVerify";
import { supabase } from "@/integrations/supabase/client";

export default function Agents() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "inactive">("all");
  
  const { 
    agents, 
    isLoading, 
    isRefreshing, 
    refetch, 
    handleManualRefresh, 
    showDiagnosticsAlert, 
    setShowDiagnosticsAlert 
  } = useAgents();
  
  const { isDiagnosing, handleDiagnose } = useAgentDiagnostics(refetch);
  
  // Check if we're coming from agent creation or edit
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
            }
          } catch (err) {
            console.error("Erro na verificação do agente:", err);
          }
        };
        
        checkAgent();
      }
      
      // Invalidate query cache to force a refresh
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      
      // Forçar uma sequência de refreshs para garantir que os dados sejam carregados
      const refreshSequence = async () => {
        console.log("Iniciando sequência de refreshs...");
        // Primeira tentativa
        await refetch();
        
        // Segunda tentativa após um breve delay
        setTimeout(async () => {
          await refetch();
          
          // Terceira tentativa após outro delay
          setTimeout(async () => {
            await refetch();
          }, 2000);
        }, 1000);
      };
      
      refreshSequence();
      
      // Clean up URL params
      navigate('/agents', { replace: true });
    } else if (agentUpdated === 'true') {
      toast.success("Agente atualizado com sucesso! Atualizando a lista...");
      
      // Invalidate query cache and refresh
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      refetch();
      
      // Clean up URL params
      navigate('/agents', { replace: true });
    }
  }, [location, navigate, queryClient, refetch, setShowDiagnosticsAlert]);
  
  const handleCreateAgent = () => {
    navigate("/agents/new");
  };

  const handleTestVoice = (id: string) => {
    const agent = agents.find(a => a.id === id);
    if (agent) {
      toast.success(`Testando voz do agente ${agent.name}`);
    }
  };

  const handleTestCall = (id: string) => {
    const agent = agents.find(a => a.id === id);
    if (agent) {
      toast.info(`Iniciando chamada de teste com ${agent.name}`);
    }
  };

  const handleEditAgent = (id: string) => {
    navigate(`/agents/${id}/edit`);
  };

  // Filter agents based on selected filter
  const filteredAgents = agents.filter(agent => {
    if (filter === "all") return true;
    return agent.status === filter;
  });

  // Force a verification when component mounts
  useEffect(() => {
    console.log("Agent component mounted, verificando agentes...");
    
    // Force refresh of agents data
    const initialCheck = async () => {
      try {
        // Aguardar um pouco para garantir que outros efeitos sejam processados
        await new Promise(r => setTimeout(r, 500));
        
        // Verificar diretamente no banco se existem agentes
        const { data: directAgentsData, error: directAgentsError } = await supabase
          .from('agents')
          .select('*');
          
        if (directAgentsError) {
          console.error("Erro ao verificar agentes diretamente:", directAgentsError);
        } else {
          console.log(`Verificação direta encontrou ${directAgentsData?.length || 0} agentes:`, 
            directAgentsData?.map(a => a.name).join(', ') || 'nenhum');
            
          if (directAgentsData && directAgentsData.length > 0) {
            // Força um refresh do React Query se encontrar agentes diretamente
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            refetch();
          }
        }
      } catch (err) {
        console.error("Erro na verificação inicial de agentes:", err);
      }
    };
    
    initialCheck();
  }, [queryClient, refetch]);

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-700">
            Seus Agentes de Voz
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Gerencie sua equipe de atendentes virtuais e configure-os para diferentes campanhas.
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

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <AgentFilters
            filter={filter}
            setFilter={setFilter}
            agents={agents}
            onRefresh={handleManualRefresh}
            isRefreshing={isRefreshing}
            onDiagnose={handleDiagnose}
            isDiagnosing={isDiagnosing}
          />
          
          <Button 
            onClick={handleCreateAgent}
            className="bg-blue-800 hover:bg-blue-900 text-white font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar Novo Agente
          </Button>
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
    </Layout>
  );
}
