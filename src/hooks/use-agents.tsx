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
      
      // Verificando dados no banco de dados - caso não existam, vamos usar agentes simulados para demonstração
      if (!data || data.length === 0) {
        console.log("No agents found in database. Using simulated agents for demo...");
        
        // Agentes simulados para demonstração do vídeo com uso de 10 dias
        const simulatedAgents = [
          {
            id: "9b3f2a1e-8c5d-4f7a-b6e3-d2c1a0f9e8b7",
            name: "Carlos - Vendas B2B",
            category: "Comercial",
            description: "Especializado em qualificação de leads e agendamento de demonstrações para software empresarial",
            status: "active",
            voice_id: VOICE_IDS.ROGER,
            assistant_id: null,
            created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "7d5e6f4c-3b2a-1d9e-8c7f-6b5a4d3c2b1a",
            name: "Mariana - Atendimento ao Cliente",
            category: "Suporte",
            description: "Especializada em resolver dúvidas técnicas e problemas com produtos",
            status: "active",
            voice_id: VOICE_IDS.SARAH,
            assistant_id: null,
            created_at: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "5a4b3c2d-1e9f-8g7h-6i5j-4k3l2m1n0o9p",
            name: "Roberto - Retenção",
            category: "Reengajamento",
            description: "Focado em reativar clientes inativos e reduzir cancelamentos",
            status: "active",
            voice_id: VOICE_IDS.THOMAS,
            assistant_id: null,
            created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "2z3y4x5w-6v7u-8t9s-0r1q-2p3o4n5m6l7k",
            name: "Ana - Follow-up",
            category: "Comercial",
            description: "Especializada em follow-up após reuniões para fechamento de vendas",
            status: "paused",
            voice_id: VOICE_IDS.ARIA,
            assistant_id: null,
            created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: "8q9w0e1r-2t3y-4u5i-6o7p-8a9s0d1f2g3h",
            name: "Paulo - Pesquisa",
            category: "Pesquisa",
            description: "Especializado em coletar feedback e realizar pesquisas de satisfação",
            status: "active",
            voice_id: VOICE_IDS.ROGER,
            assistant_id: null,
            created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
          }
        ];

        return simulatedAgents;
      }
      
      return data || [];
    } catch (e) {
      console.error("Exception in fetchAgentsData:", e);
      toast.error("Falha ao buscar agentes");
      setShowDiagnosticsAlert(true);
      return [];
    }
  }, [isCreatingDemoAgent]);
  
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
    // Usar valores mais realistas para simular uso de 10 dias
    const hash = Array.from(agentId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Gerar números mais altos para chamadas (entre 180-950)
    const calls = 180 + (hash % 770);
    
    // Taxa de sucesso entre 65-95% com tendência para altos
    const successRate = 65 + (hash % 30);
    
    // Mudança positiva na taxa de sucesso (mostrando melhoria ao longo do tempo)
    const successChange = `+${(2 + (hash % 8)).toFixed(1)}%`;
    
    // Gerar tempo médio de chamada realista
    const avgMinutes = 1 + (hash % 4);
    const avgSeconds = (hash % 60).toString().padStart(2, '0');
    const avgTime = `${avgMinutes}:${avgSeconds}`;
    
    // Gerar atividade recente (principalmente hoje e ontem)
    const activities = [
      "Hoje, 14:30", 
      "Hoje, 11:15",
      "Hoje, 09:45",
      "Ontem, 17:20",
      "Ontem, 15:05",
      "Ontem, 10:30",
    ];
    const lastActivity = activities[hash % activities.length];
    
    return {
      calls,
      avgTime,
      successRate,
      successChange,
      lastActivity
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
          assistantId: agent.assistant_id, // Map assistant_id from database
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
    createDemoAgent: () => console.log("Demo agent creation not needed - using simulated agents"),
    isCreatingDemoAgent: false
  };
}
