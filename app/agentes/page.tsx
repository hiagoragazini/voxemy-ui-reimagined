
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AgentGrid } from "@/components/ui/agent-grid";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Filter, Plus, UserCheck, UserX, Clock } from "lucide-react";
import { AgentCardProps } from "@/components/ui/agent-card";

// Lista de vozes de qualidade do Eleven Labs com seus IDs
const VOICES = {
  SARAH: "EXAVITQu4vr4xnSDxMaL", // Sarah - voz feminina
  ROGER: "CwhRBWXzGAHq8TQ4Fs17", // Roger - voz masculina
  THOMAS: "GBv7mTt0atIp3Br8iCZE", // Thomas - voz masculina britânica
  ARIA: "9BWtsMINqrJLrRacOk9x", // Aria - voz feminina
  LAURA: "FGY2WhTYpPnrIDTdsKH5", // Laura - voz feminina
};

// Mock data com os mesmos agentes que na dashboard, garantindo consistência
const mockAgents: AgentCardProps[] = [
  {
    id: "1",
    name: "Assistente de Vendas",
    category: "Comercial",
    description: "Agente inteligente para atendimento e qualificação de leads de vendas.",
    status: "active",
    calls: 127,
    avgTime: "4:32",
    successRate: 68,
    successChange: "+5.2%",
    lastActivity: "Hoje, 14:30",
    avatarLetter: "A",
    avatarColor: "bg-violet-100",
    voiceId: VOICES.ROGER,
  },
  {
    id: "2",
    name: "Atendente de Suporte",
    category: "Suporte",
    description: "Responde dúvidas e resolve problemas de clientes automaticamente.",
    status: "active",
    calls: 85,
    avgTime: "5:15",
    successRate: 92,
    successChange: "+1.2%",
    lastActivity: "Ontem, 17:20",
    avatarLetter: "A",
    avatarColor: "bg-blue-100",
    voiceId: VOICES.SARAH,
  },
  {
    id: "3",
    name: "Pesquisador de Mercado",
    category: "Pesquisa",
    description: "Realiza pesquisas de mercado e coleta feedback de clientes.",
    status: "paused",
    calls: 42,
    avgTime: "2:48",
    successRate: 75,
    successChange: "-0.7%",
    lastActivity: "22/04/2025",
    avatarLetter: "P",
    avatarColor: "bg-green-100",
    voiceId: VOICES.THOMAS,
  },
  {
    id: "4",
    name: "Agendador",
    category: "Agendamentos",
    description: "Agenda compromissos e gerencia calendários de forma automática.",
    status: "inactive",
    calls: 0,
    avgTime: "0:00",
    successRate: 0,
    successChange: "0%",
    lastActivity: "",
    avatarLetter: "A",
    avatarColor: "bg-red-100",
    voiceId: VOICES.ARIA,
  }
];

export default function AgentesPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "inactive">("all");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateAgent = () => {
    console.log("Redirecionando para criação de novo agente...");
    router.push('/agentes/novo');
  };

  const handleTestVoice = (id: string) => {
    // Esta função não será mais chamada pois removemos o botão,
    // mas mantemos por compatibilidade de interface
  };

  const handleEditAgent = (id: string) => {
    console.log(`Editando agente ${id}...`);
    router.push(`/agentes/${id}/editar`);
  };

  // Filter agents based on selected filter
  const filteredAgents = mockAgents.filter(agent => {
    if (filter === "all") return true;
    return agent.status === filter;
  });

  const getFilterCount = (filterType: "active" | "paused" | "inactive") => {
    return mockAgents.filter(agent => agent.status === filterType).length;
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
              <span>Todos ({mockAgents.length})</span>
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
