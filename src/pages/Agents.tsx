
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

export default function Agents() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "inactive">("all");
  const [hasRun, setHasRun] = useState(false); // Estado para controlar se já executamos a inicialização
  
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
    isCreatingDemoAgent // Properly destructure this state from the hook
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
      
      // Sequência intensiva de atualizações
      const refreshSequence = async () => {
        console.log("Iniciando sequência de refreshs após criação de agente...");
        
        // Primeira tentativa imediata
        await refetch();
        
        // Segunda e terceira tentativas com atrasos
        setTimeout(async () => {
          await refetch();
          
          setTimeout(async () => {
            await refetch();
            
            // Verificação final
            const { data } = await supabase.from('agents').select('count');
            console.log(`Verificação final: ${data?.length || 0} agentes no banco`);
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
      forceRefresh();
      
      // Clean up URL params
      navigate('/agents', { replace: true });
    }
  }, [location, navigate, queryClient, refetch, forceRefresh]);
  
  const handleCreateAgent = () => {
    navigate("/agents/new");
  };

  const handleCreateDemoAgent = () => {
    createDemoAgent();
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
    // Evitar múltiplas verificações iniciais
    if (hasRun) return;
    
    console.log("Agent component mounted, verificando agentes...");
    setHasRun(true);
    
    // Force refresh of agents data
    const initialCheck = async () => {
      try {
        // Aguardar um pouco para garantir que outros efeitos sejam processados
        await new Promise(r => setTimeout(r, 800));
        
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
            console.log("Agentes encontrados diretamente, forçando refresh dos dados...");
            queryClient.invalidateQueries({ queryKey: ['agents'] });
            forceRefresh();
            
            // Criar um pequeno intervalo de verificação para garantir atualização
            let attempts = 0;
            const checkAgentsLoaded = setInterval(() => {
              attempts++;
              if (agents.length > 0 || attempts > 5) {
                clearInterval(checkAgentsLoaded);
                console.log(`Agentes carregados após ${attempts} tentativas:`, agents.length);
              } else {
                console.log(`Tentativa ${attempts}: Ainda esperando agentes serem carregados...`);
                forceRefresh();
                refetch();
              }
            }, 1000);
          } else if (!isCreatingDemoAgent) {
            // Se não encontrou agentes, vamos criar um demo
            console.log("Nenhum agente encontrado, criando agente demo...");
            createDemoAgent();
          }
        }
      } catch (err) {
        console.error("Erro na verificação inicial de agentes:", err);
      }
    };
    
    initialCheck();
  }, [queryClient, forceRefresh, agents, refetch, hasRun, isCreatingDemoAgent, createDemoAgent]); // Add isCreatingDemoAgent to dependencies

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
          
          <div className="flex gap-2">
            <Button
              onClick={handleCreateDemoAgent}
              className="bg-green-600 hover:bg-green-700 text-white font-medium flex items-center gap-2"
            >
              <Sparkles className="h-4 w-4" />
              Criar Agente Demo
            </Button>
            
            <Button 
              onClick={handleCreateAgent}
              className="bg-blue-800 hover:bg-blue-900 text-white font-medium flex items-center gap-2"
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
    </Layout>
  );
}
