
import { useState, useCallback, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getAvatarColor } from "@/utils/colors";
import { AgentCardProps } from "@/components/agents/AgentCard";
import { VOICES, VOICE_IDS } from "@/constants/voices";

export function useAgents() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showDiagnosticsAlert, setShowDiagnosticsAlert] = useState(false);
  const [lastRefreshTimestamp, setLastRefreshTimestamp] = useState(Date.now());
  const [isCreatingDemoAgent, setIsCreatingDemoAgent] = useState(false);
  const [stabilizedAgents, setStabilizedAgents] = useState<AgentCardProps[]>([]);
  
  // Define the fetch function separately so we can reuse it
  const fetchAgentsData = useCallback(async () => {
    console.log("Fetching agents data from Supabase...");
    
    try {
      // Small delay to ensure Supabase has time to commit any recent changes
      await new Promise(r => setTimeout(r, 300));
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching agents:', error);
        toast.error('Erro ao carregar agentes: ' + error.message);
        setShowDiagnosticsAlert(true);
        throw error;
      }
      
      console.log("Agents data retrieved:", data);
      if (!data || data.length === 0) {
        console.log("No agents found in database. Creating demo agent...");
        setShowDiagnosticsAlert(true);
        
        // Criar agente de demonstração se não existir nenhum e não estiver já criando
        if (!isCreatingDemoAgent) {
          createDemoAgent();
        }
      } else {
        console.log(`Found ${data.length} agents in database:`, data.map(a => a.name).join(', '));
        setShowDiagnosticsAlert(false);
      }
      return data || [];
    } catch (e) {
      console.error("Exception in fetchAgentsData:", e);
      toast.error("Falha ao buscar agentes");
      setShowDiagnosticsAlert(true);
      return [];
    }
  }, [isCreatingDemoAgent]);
  
  // Função para criar um agente de demonstração
  const createDemoAgent = async () => {
    try {
      setIsCreatingDemoAgent(true);
      console.log("Criando agente de demonstração...");
      
      const demoAgent = {
        name: "Ana Atendimento",
        description: "Agente de demonstração para atendimento ao cliente",
        category: "Atendimento",
        voice_id: VOICE_IDS.SARAH,
        status: "active",
        instructions: "Seja cordial e objetivo nas respostas. Procure resolver o problema do cliente de forma eficiente.",
        response_style: "Formal e amigável",
        default_greeting: "Olá, meu nome é Ana. Como posso ajudar você hoje?",
        max_response_length: 200,
        knowledge: "Informações sobre produtos e serviços da empresa.\n\nPerguntas frequentes sobre atendimento ao cliente.",
        ai_model: "gpt-4o-mini",
        conversation_prompt: "Você é Ana, uma assistente virtual especializada em atendimento ao cliente."
      };
      
      const { data, error } = await supabase
        .from('agents')
        .insert(demoAgent)
        .select();
        
      if (error) {
        console.error("Erro ao criar agente de demonstração:", error);
        toast.error("Não foi possível criar o agente de demonstração");
      } else if (data && data.length > 0) {
        console.log("Agente de demonstração criado com sucesso:", data[0]);
        toast.success("Agente de demonstração 'Ana Atendimento' criado com sucesso!");
        // Forçar atualização da lista
        setLastRefreshTimestamp(Date.now());
      }
    } catch (e) {
      console.error("Erro ao criar agente de demonstração:", e);
    } finally {
      setIsCreatingDemoAgent(false);
    }
  };

  // Fetch agents from Supabase with more conservative refresh settings
  const { data: agentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['agents', lastRefreshTimestamp],
    queryFn: fetchAgentsData,
    refetchOnWindowFocus: false,
    refetchInterval: false,
    staleTime: 30000,
    retry: 1,
    retryDelay: 1000,
  });

  // Generate stable random values for each agent once
  const generateStableValues = useCallback((agentId: string) => {
    // Use a deterministic "random" based on agent ID
    const hash = Array.from(agentId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    return {
      calls: 10 + (hash % 190), // Between 10-200
      avgTime: `${1 + (hash % 4)}:${(hash % 60).toString().padStart(2, '0')}`, // Between 1:00-5:59
      successRate: 65 + (hash % 30), // Between 65-95%
      successChange: `+${(1 + (hash % 9)).toFixed(1)}%`, // Between +1.0% and +9.9%
      lastActivity: getStableRandomActivity(hash),
    };
  }, []);

  // Estabilizador para prevenir re-renderizações quando os dados não mudaram
  useEffect(() => {
    if (agentsData && agentsData.length > 0) {
      // Transformar dados para AgentCardProps com valores estáveis
      const transformedAgents: AgentCardProps[] = agentsData.map(agent => {
        const stableValues = generateStableValues(agent.id);
        
        return {
          id: agent.id,
          name: agent.name,
          category: agent.category,
          description: agent.description || "",
          status: agent.status as "active" | "paused" | "inactive",
          calls: stableValues.calls,
          avgTime: stableValues.avgTime, 
          successRate: stableValues.successRate,
          successChange: stableValues.successChange,
          lastActivity: stableValues.lastActivity,
          avatarLetter: agent.name.charAt(0),
          avatarColor: getAvatarColor(agent.name),
          voiceId: agent.voice_id || VOICE_IDS.ROGER,
        };
      });

      // Verificar se os dados realmente mudaram antes de atualizar o estado
      const hasChanges = JSON.stringify(transformedAgents.map(a => a.id)) !== 
                         JSON.stringify(stabilizedAgents.map(a => a.id));
      
      if (hasChanges) {
        console.log("Agentes atualizados, dados diferentes detectados");
        setStabilizedAgents(transformedAgents);
      } else {
        console.log("Dados de agentes iguais, não atualizando o estado");
      }
    } else if (agentsData && agentsData.length === 0 && stabilizedAgents.length > 0) {
      // Limpar agentes apenas se a lista passar de ter itens para estar vazia
      setStabilizedAgents([]);
    }
  }, [agentsData, stabilizedAgents, generateStableValues]);

  // Manual refresh function with single attempt
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Atualizando lista de agentes...");
    
    try {
      // Forçar invalidação do cache
      setLastRefreshTimestamp(Date.now());
      await refetch();
    } catch (err) {
      console.error("Erro ao atualizar agentes:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    // Retornar agentes estabilizados em vez de agentsData diretamente
    agents: stabilizedAgents,
    isLoading, 
    error,
    isRefreshing,
    refetch,
    handleManualRefresh,
    showDiagnosticsAlert,
    setShowDiagnosticsAlert,
    forceRefresh: () => setLastRefreshTimestamp(Date.now()),
    createDemoAgent,
    isCreatingDemoAgent
  };
}

// Helper function to generate stable random activity dates
function getStableRandomActivity(seed: number) {
  const activities = [
    "Hoje, 14:30", 
    "Ontem, 17:20", 
    "22/04/2025", 
    "15/04/2025", 
    "10/04/2025"
  ];
  return activities[seed % activities.length];
}
