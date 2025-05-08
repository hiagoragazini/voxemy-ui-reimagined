
import { useState } from "react";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { AgentCard, AgentCardProps } from "@/components/agents/AgentCard";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { useNavigate } from "react-router-dom";
import { Filter, Plus, UserCheck, UserX, Clock } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "inactive">("all");
  
  // Fetch agents from Supabase
  const { data: agentsData, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*');
      
      if (error) {
        console.error('Error fetching agents:', error);
        toast.error('Erro ao carregar agentes');
        return [];
      }
      
      return data || [];
    }
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
    voiceId: agent.voice_id || VOICES.ROGER,
  })) || [];

  const handleCreateAgent = () => {
    navigate("/agents/new");
  };

  const handleTestVoice = (id: string) => {
    const agent = agents.find(a => a.id === id);
    if (agent) {
      toast.success(`Testando voz do agente ${agent.name}`);
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

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-violet-500">
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
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium flex items-center gap-2"
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
    "bg-blue-100", "bg-purple-100", "bg-green-100", 
    "bg-yellow-100", "bg-red-100", "bg-pink-100",
    "bg-indigo-100", "bg-orange-100", "bg-violet-100"
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}
