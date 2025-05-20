
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AgentGrid } from "@/components/ui/agent-grid";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Filter, Plus, UserCheck, UserX, Clock, RefreshCcw } from "lucide-react";
import { AgentCardProps } from "@/components/ui/agent-card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

// Lista de vozes de qualidade do Eleven Labs com seus IDs
const VOICES = {
  SARAH: "EXAVITQu4vr4xnSDxMaL", // Sarah - voz feminina
  ROGER: "CwhRBWXzGAHq8TQ4Fs17", // Roger - voz masculina
  THOMAS: "GBv7mTt0atIp3Br8iCZE", // Thomas - voz masculina britânica
  ARIA: "9BWtsMINqrJLrRacOk9x", // Aria - voz feminina
  LAURA: "FGY2WhTYpPnrIDTdsKH5", // Laura - voz feminina
};

/**
 * Diagnose database connection and permission issues
 */
async function diagnoseAgentIssues() {
  try {
    toast.info("Iniciando diagnóstico de problemas com agentes...");
    
    // 1. Verificar autenticação
    const { data: user, error: authError } = await supabase.auth.getUser();
    if (authError) {
      console.error("Erro de autenticação:", authError);
      toast.error("Problema de autenticação detectado");
      return false;
    }
    
    if (!user || !user.user) {
      console.warn("Usuário não autenticado");
      toast.warning("Você não está autenticado. Faça login para visualizar seus agentes.");
      return false;
    }
    
    console.log("Usuário autenticado:", user.user.email);
    
    // 2. Tentar inserir um agente de teste
    const testAgentName = `Agente de Teste ${new Date().toISOString()}`;
    toast.info("Tentando criar um agente de teste para diagnóstico...");
    
    const { data: insertedAgent, error: insertError } = await supabase
      .from('agents')
      .insert({
        name: testAgentName,
        status: 'testing',
        description: 'Agente criado para diagnóstico',
        category: 'Teste',
        voice_id: 'EXAVITQu4vr4xnSDxMaL' // ID da voz Sarah
      })
      .select();
    
    if (insertError) {
      console.error("Erro ao inserir agente de teste:", insertError);
      toast.error("Não foi possível criar agente de teste: " + insertError.message);
      
      if (insertError.code === '42P01') {
        toast.error("A tabela 'agents' não existe no banco de dados!");
      } else if (insertError.code === '23505') {
        toast.warning("Já existe um agente com esse nome");
      } else if (insertError.code === '42501') {
        toast.error("Você não tem permissão para inserir dados");
      }
      
      return false;
    }
    
    console.log("Agente de teste criado com sucesso:", insertedAgent);
    toast.success("Agente de teste criado com sucesso!");
    
    // 3. Buscar o agente de teste que acabamos de criar
    const { data: fetchedAgent, error: fetchError } = await supabase
      .from('agents')
      .select('*')
      .eq('name', testAgentName)
      .maybeSingle();
    
    if (fetchError) {
      console.error("Erro ao buscar agente de teste:", fetchError);
      toast.error("Erro ao buscar agente de teste após criação");
      return false;
    }
    
    if (!fetchedAgent) {
      console.error("Agente de teste não encontrado após criação");
      toast.error("O agente foi criado mas não pode ser recuperado - possível problema de permissões");
      return false;
    }
    
    console.log("Agente de teste recuperado com sucesso:", fetchedAgent);
    toast.success("Sistema funcionando corretamente! O agente pode ser criado e recuperado.");
    
    // Limpeza - remover o agente de teste
    const { error: deleteError } = await supabase
      .from('agents')
      .delete()
      .eq('name', testAgentName);
    
    if (deleteError) {
      console.warn("Não foi possível limpar o agente de teste:", deleteError);
    } else {
      console.log("Agente de teste removido com sucesso");
    }
    
    return true;
  } catch (err) {
    console.error("Erro no diagnóstico:", err);
    toast.error("Falha no processo de diagnóstico");
    return false;
  }
}

export default function AgentesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "inactive">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [agentsData, setAgentsData] = useState<any[]>([]);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  
  // Check if we're coming from agent creation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const agentCreated = params.get('created');
      const agentUpdated = params.get('updated');
      
      if (agentCreated === 'true') {
        toast.success("Agente criado com sucesso! Aguarde alguns instantes para ver na lista.");
        
        // Remove the query parameter
        router.replace('/agentes');
        
        // Force immediate refresh
        fetchAgents(true);
      } else if (agentUpdated === 'true') {
        toast.success("Agente atualizado com sucesso! Atualizando a lista...");
        
        // Remove the query parameter
        router.replace('/agentes');
        
        // Force immediate refresh
        fetchAgents(true);
      }
    }
  }, [router]);
  
  // Fetch agents data from Supabase
  async function fetchAgents(showToast = false) {
    try {
      if (showToast) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      
      console.log("Fetching agents data in Next.js app/agentes/page.tsx");
      
      const { data, error } = await supabase
        .from('agents')
        .select('*');
          
      if (error) {
        console.error('Error fetching agents:', error);
        toast.error('Erro ao carregar agentes');
        setAgentsData([]);
      } else {
        console.log("Agents data from Supabase:", data);
        setAgentsData(data || []);
        
        if (data && data.length > 0) {
          console.log(`Encontrados ${data.length} agentes no banco de dados.`);
          if (showToast) {
            toast.success(`${data.length} agente(s) encontrado(s)`);
          }
        } else {
          console.log("No agents found in database. Please create one.");
          if (showToast) {
            toast.warning("Nenhum agente encontrado no banco de dados");
          }
        }
      }
    } catch (err) {
      console.error('Error in fetchAgents:', err);
      toast.error('Ocorreu um erro ao buscar os agentes');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }
  
  // Manual refresh function
  const handleManualRefresh = () => {
    toast.info("Atualizando lista de agentes...");
    fetchAgents(true);
  };
  
  useEffect(() => {
    fetchAgents();
    
    // Set up a refresh interval
    const interval = setInterval(() => {
      fetchAgents();
    }, 3000); // Refresh every 3 seconds
    
    return () => clearInterval(interval);
  }, []);

  // Transform Supabase data to AgentCardProps
  const agents: AgentCardProps[] = agentsData.map(agent => ({
    id: agent.id,
    name: agent.name,
    category: agent.category,
    description: agent.description || "",
    status: agent.status as "active" | "paused" | "inactive",
    calls: Math.floor(Math.random() * 200), // Placeholder data
    avgTime: `${Math.floor(Math.random() * 5)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`, // Placeholder
    successRate: Math.floor(Math.random() * 100), // Placeholder
    successChange: `+${(Math.random() * 10).toFixed(1)}%`, // Placeholder
    lastActivity: "Hoje, 14:30", // Placeholder
    avatarLetter: agent.name.charAt(0),
    avatarColor: getAvatarColor(agent.name),
    voiceId: agent.voice_id || VOICES.ROGER,
  }));

  const handleCreateAgent = () => {
    console.log("Redirecionando para criação de novo agente...");
    router.push('/agentes/novo');
  };

  const handleTestVoice = (id: string) => {
    // Esta função não será mais chamada pois removemos o botão,
    // mas mantemos por compatibilidade de interface
  };

  const handleTestCall = (id: string) => {
    const agent = agents.find(a => a.id === id);
    if (agent) {
      toast.info(`Iniciando chamada de teste com ${agent.name}`);
    }
  };

  const handleEditAgent = (id: string) => {
    console.log(`Editando agente ${id}...`);
    router.push(`/agentes/${id}/editar`);
  };

  // Filter agents based on selected filter
  const filteredAgents = agents.filter(agent => {
    if (filter === "all") return true;
    return agent.status === filter;
  });

  const getFilterCount = (filterType: "active" | "paused" | "inactive") => {
    return agents.filter(agent => agent.status === filterType).length;
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-4xl font-bold text-blue-700">
            Seus Agentes de Voz
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Gerencie sua equipe de atendentes virtuais e configure-os para diferentes campanhas.
          </p>
        </div>

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
            
            <div className="flex gap-2 mt-2 sm:mt-0">
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
          isLoading={isLoading} 
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
