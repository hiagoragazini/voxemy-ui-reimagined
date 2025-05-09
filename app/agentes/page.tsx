"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AgentGrid } from "@/components/ui/agent-grid";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Filter, Plus, UserCheck, UserX, Clock } from "lucide-react";
import { AgentCardProps } from "@/components/ui/agent-card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Lista de vozes de qualidade do Eleven Labs com seus IDs
const VOICES = {
  SARAH: "EXAVITQu4vr4xnSDxMaL", // Sarah - voz feminina
  ROGER: "CwhRBWXzGAHq8TQ4Fs17", // Roger - voz masculina
  THOMAS: "GBv7mTt0atIp3Br8iCZE", // Thomas - voz masculina britânica
  ARIA: "9BWtsMINqrJLrRacOk9x", // Aria - voz feminina
  LAURA: "FGY2WhTYpPnrIDTdsKH5", // Laura - voz feminina
};

export default function AgentesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "inactive">("all");
  const [isLoading, setIsLoading] = useState(true);
  const [agentsData, setAgentsData] = useState<any[]>([]);

  // Check if we're coming from agent creation
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const agentCreated = params.get('created');
    
    if (agentCreated === 'true') {
      toast.success("Agente criado com sucesso! Aguarde alguns instantes para ver na lista.");
      
      // Remove the query parameter
      router.replace('/agentes');
    }
  }, [router]);
  
  // Fetch agents data from Supabase
  useEffect(() => {
    async function fetchAgents() {
      try {
        console.log("Fetching agents data in Next.js app/agentes/page.tsx");
        setIsLoading(true);
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
          if (data && data.length === 0) {
            console.log("No agents found in database. Please create one.");
          }
        }
      } catch (err) {
        console.error('Error in fetchAgents:', err);
        toast.error('Ocorreu um erro ao buscar os agentes');
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchAgents();
    
    // Set up a refresh interval
    const interval = setInterval(() => {
      fetchAgents();
    }, 5000); // Refresh every 5 seconds
    
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
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-700">
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
          onAgentEditClick={handleEditAgent}
          onTestVoice={handleTestVoice}
          onCreateAgent={handleCreateAgent}
          onTestCall={handleTestCall}
        />
      </div>
    </Layout>
  );
}

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
