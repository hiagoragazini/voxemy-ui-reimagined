import { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { AgentCard, AgentCardProps } from "@/components/agents/AgentCard";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { useNavigate, useLocation } from "react-router-dom";
import { Filter, Plus, UserCheck, UserX, Clock, RefreshCcw, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { verifyAgentCreation, forceRefreshAgents, diagnoseAgentIssues } from "@/utils/dbVerify";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

// Lista de vozes de qualidade do Eleven Labs com seus IDs
export const VOICES = {
  SARAH: "EXAVITQu4vr4xnSDxMaL", // Sarah - voz feminina
  ROGER: "CwhRBWXzGAHq8TQ4Fs17", // Roger - voz masculina
  THOMAS: "GBv7mTt0atIp3Br8iCZE", // Thomas - voz masculina britânica
  ARIA: "9BWtsMINqrJLrRacOk9x", // Aria - voz feminina
  LAURA: "FGY2WhTYpPnrIDTdsKH5", // Laura - voz feminina
};

export default function Agents() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "inactive">("all");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [showDiagnosticsAlert, setShowDiagnosticsAlert] = useState(false);
  
  // Check if we're coming from agent creation or edit
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const agentCreated = params.get('created');
    const agentUpdated = params.get('updated');
    const agentId = params.get('id');
    
    if (agentCreated === 'true') {
      toast.success("Agente criado com sucesso! Atualizando a lista...");
      setShowDiagnosticsAlert(true); // Mostrar alerta após criação
      
      // Verify if the agent was actually created
      setTimeout(() => {
        verifyAgentCreation(agentId || undefined);
        queryClient.invalidateQueries({ queryKey: ['agents'] });
      }, 1000);
      
      // Clean up URL params
      navigate('/agents', { replace: true });
    } else if (agentUpdated === 'true') {
      toast.success("Agente atualizado com sucesso! Atualizando a lista...");
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      
      // Clean up URL params
      navigate('/agents', { replace: true });
    }
  }, [location, navigate, queryClient]);
  
  // Define the fetch function separately so we can reuse it
  const fetchAgentsData = useCallback(async () => {
    console.log("Fetching agents data from Supabase in React Router app...");
    
    try {
      const { data, error } = await supabase
        .from('agents')
        .select('*');
      
      if (error) {
        console.error('Error fetching agents:', error);
        toast.error('Erro ao carregar agentes: ' + error.message);
        setShowDiagnosticsAlert(true); // Mostrar alerta quando há erro
        throw error;
      }
      
      console.log("Agents data retrieved:", data);
      if (data && data.length === 0) {
        console.log("No agents found in database. Please create one.");
        setShowDiagnosticsAlert(true); // Mostrar alerta quando não há agentes
      } else {
        setShowDiagnosticsAlert(false); // Esconder alerta quando há agentes
      }
      return data || [];
    } catch (e) {
      console.error("Exception in fetchAgentsData:", e);
      toast.error("Falha ao buscar agentes");
      setShowDiagnosticsAlert(true); // Mostrar alerta quando há exceção
      return [];
    }
  }, []);

  // Fetch agents from Supabase
  const { data: agentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['agents'],
    queryFn: fetchAgentsData,
    // Configure query for more aggressive refetching
    refetchOnWindowFocus: true,
    refetchInterval: 3000, // Refetch every 3 seconds (more aggressive)
    staleTime: 1000, // Data becomes stale faster
  });

  // Manual refresh function
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Atualizando lista de agentes...");
    
    try {
      await forceRefreshAgents();
      await refetch();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Diagnose function
  const handleDiagnose = async () => {
    setIsDiagnosing(true);
    toast.info("Iniciando diagnóstico do sistema...");
    
    try {
      const result = await diagnoseAgentIssues();
      await refetch();
      if (result) {
        toast.info("Diagnóstico concluído. Tente recarregar a página se os agentes ainda não aparecerem.", {
          duration: 10000,
          action: {
            label: "Recarregar",
            onClick: () => window.location.reload()
          }
        });
      }
    } finally {
      setIsDiagnosing(false);
    }
  };

  // Transform Supabase data to AgentCardProps
  const agents: AgentCardProps[] = agentsData?.map(agent => ({
    id: agent.id,
    name: agent.name,
    category: agent.category,
    description: agent.description || "",
    status: agent.status as "active" | "paused" | "inactive",
    calls: Math.floor(Math.random() * 200), // Placeholder data
    avgTime: `${Math.floor(Math.random() * 5)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`, // Placeholder
    successRate: Math.floor(Math.random() * 100), // Placeholder
    successChange: `+${(Math.random() * 10).toFixed(1)}%`, // Placeholder
    lastActivity: getRandomActivity(), // Placeholder
    avatarLetter: agent.name.charAt(0),
    avatarColor: getAvatarColor(agent.name),
    voiceId: agent.voice_id || VOICES.ROGER,
  })) || [];

  if (error) {
    console.error("Error in agents query:", error);
  }

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

  const getFilterCount = (filterType: "active" | "paused" | "inactive") => {
    return agents.filter(agent => agent.status === filterType).length;
  };

  // Force a verification when component mounts
  useEffect(() => {
    console.log("Agent component mounted, verifying database...");
    verifyAgentCreation();
  }, []);

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
          <Alert variant="default" className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Problemas com a exibição de agentes</AlertTitle>
            <AlertDescription>
              Parece que seus agentes não estão sendo exibidos corretamente. Utilize as opções abaixo para diagnosticar 
              e resolver problemas de conexão com o banco de dados.
            </AlertDescription>
            <div className="mt-4 flex gap-4">
              <Button 
                variant="secondary" 
                onClick={handleDiagnose} 
                disabled={isDiagnosing}
                className="bg-amber-100 text-amber-800 hover:bg-amber-200"
              >
                {isDiagnosing ? (
                  <><RefreshCcw className="h-4 w-4 mr-2 animate-spin" /> Diagnosticando...</>
                ) : (
                  <>Diagnosticar problemas</>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={handleManualRefresh} 
                disabled={isRefreshing}
              >
                <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Atualizar
              </Button>
            </div>
          </Alert>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Button 
              variant={filter === "all" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("all")}
              className="flex items-center gap-1.5"
            >
              <Filter className="h-4 w-4" />
              <span>Todos ({agents.length})</span>
            </Button>
            <Button 
              variant={filter === "active" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("active")}
              className="flex items-center gap-1.5"
            >
              <UserCheck className="h-4 w-4 text-green-500" />
              <span>Ativos ({getFilterCount("active")})</span>
            </Button>
            <Button 
              variant={filter === "paused" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("paused")}
              className="flex items-center gap-1.5"
            >
              <Clock className="h-4 w-4 text-amber-500" />
              <span>Pausados ({getFilterCount("paused")})</span>
            </Button>
            <Button 
              variant={filter === "inactive" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("inactive")}
              className="flex items-center gap-1.5"
            >
              <UserX className="h-4 w-4 text-gray-500" />
              <span>Inativos ({getFilterCount("inactive")})</span>
            </Button>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
              >
                <RefreshCcw className={`h-4 w-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Atualizar</span>
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDiagnose}
                disabled={isDiagnosing}
              >
                {isDiagnosing ? 
                  <span className="flex items-center">
                    <RefreshCcw className="h-4 w-4 mr-1 animate-spin" />
                    Diagnosticando...
                  </span> : 
                  "Diagnosticar problemas"
                }
              </Button>
            </div>
          </div>
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
          onAgentEditClick={handleEditAgent}
          onTestVoice={handleTestVoice}
          onCreateAgent={handleCreateAgent}
          onTestCall={handleTestCall}
        />
      </div>
    </Layout>
  );
}

// Helper functions
function getRandomActivity() {
  const activities = [
    "Hoje, 14:30", 
    "Ontem, 17:20", 
    "22/04/2025", 
    "15/04/2025", 
    "10/04/2025"
  ];
  return activities[Math.floor(Math.random() * activities.length)];
}

function getAvatarColor(name: string) {
  const colors = [
    "bg-blue-100", "bg-sky-100", "bg-cyan-100", 
    "bg-teal-100", "bg-blue-100", "bg-sky-100",
    "bg-cyan-100", "bg-teal-100", "bg-blue-100"
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}
