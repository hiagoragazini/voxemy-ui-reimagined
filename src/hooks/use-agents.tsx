
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
  
  // Define the fetch function separately so we can reuse it
  const fetchAgentsData = useCallback(async () => {
    console.log("Fetching agents data from Supabase...");
    
    try {
      // Add a small delay to ensure Supabase has time to commit any recent changes
      await new Promise(r => setTimeout(r, 500));
      
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

  // Force refresh when needed
  useEffect(() => {
    const checkForAgents = async () => {
      try {
        const { data: countData } = await supabase
          .from('agents')
          .select('count');
          
        const count = countData ? countData.length : 0;
        console.log(`Direct DB check found ${count} agents`);
        
        if (count > 0) {
          setShowDiagnosticsAlert(false);
          // Recuperar dados dos agentes diretamente para verificar
          const { data: agentsData } = await supabase
            .from('agents')
            .select('*');
          
          if (agentsData && agentsData.length > 0) {
            console.log(`Verificação direta encontrou ${agentsData.length} agentes:`, 
              agentsData.map(a => a.name).join(', '));
          } else {
            console.log("No agents found in direct check");
          }
        }
      } catch (e) {
        console.error("Error in direct DB check:", e);
      }
    };
    
    checkForAgents();
  }, [lastRefreshTimestamp]);

  // Fetch agents from Supabase
  const { data: agentsData, isLoading, error, refetch } = useQuery({
    queryKey: ['agents', lastRefreshTimestamp],
    queryFn: fetchAgentsData,
    // Configure query for more aggressive refetching
    refetchOnWindowFocus: true,
    refetchInterval: 3000, // Refetch every 3 seconds
    staleTime: 1000, // Data becomes stale after 1 second
    retry: 3, // Retry failed requests up to 3 times
    retryDelay: 1000, // Wait 1 second between retries
  });

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
    voiceId: agent.voice_id || VOICE_IDS.ROGER,
  })) || [];

  // Manual refresh function with multiple retry attempts
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    toast.info("Atualizando lista de agentes...");
    
    try {
      // Force cache invalidation by updating timestamp
      setLastRefreshTimestamp(Date.now());
      
      // First attempt
      await refetch();
      
      // Check directly from database to confirm
      const { data: directCheck, error: directError } = await supabase
        .from('agents')
        .select('*');
        
      if (directError) {
        console.error("Error in direct check:", directError);
      } else if (directCheck && directCheck.length > 0) {
        console.log(`Direct check found ${directCheck.length} agents`);
        toast.success(`${directCheck.length} agentes encontrados`);
      } else {
        console.log("No agents found in direct check");
        
        // Second attempt after delay
        setTimeout(async () => {
          await refetch();
        }, 2000);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    agents,
    isLoading,
    error,
    isRefreshing,
    refetch,
    handleManualRefresh,
    showDiagnosticsAlert,
    setShowDiagnosticsAlert,
    forceRefresh: () => setLastRefreshTimestamp(Date.now()),
    createDemoAgent
  };
}

// Helper function
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
