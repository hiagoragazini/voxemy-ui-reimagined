
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AgentGrid } from "@/components/ui/agent-grid";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Filter, Plus, UserCheck, UserX, Clock } from "lucide-react";
import { AgentCardProps } from "@/components/ui/agent-card";

// Lista de vozes de qualidade do Eleven Labs com seus IDs
const VOICES = {
  SARAH: "EXAVITQu4vr4xnSDxMaL", // Sarah - voz feminina
  ROGER: "CwhRBWXzGAHq8TQ4Fs17", // Roger - voz masculina
  THOMAS: "GBv7mTt0atIp3Br8iCZE", // Thomas - voz masculina britânica
};

// Mock data com apenas 3 agentes, cada um com uma voz diferente
const mockAgents: AgentCardProps[] = [
  {
    id: "1",
    name: "Sofia Atendente",
    description: "Especialista em atendimento ao cliente, ideal para suporte técnico e dúvidas frequentes.",
    category: "Atendimento",
    status: "active",
    calls: 253,
    avgTime: "2:14",
    successRate: 92,
    lastActivity: "Hoje às 14:25",
    avatarLetter: "S",
    avatarColor: "bg-violet-100",
    voiceId: VOICES.SARAH, // Voz feminina
  },
  {
    id: "2",
    name: "Carlos Vendas",
    description: "Focado em qualificação de leads e conversão de vendas para produtos tecnológicos.",
    category: "Vendas",
    status: "active",
    calls: 187,
    avgTime: "3:22",
    successRate: 78,
    lastActivity: "Hoje às 12:10",
    avatarLetter: "C",
    avatarColor: "bg-blue-100",
    voiceId: VOICES.ROGER, // Voz masculina
  },
  {
    id: "3",
    name: "Thomas Suporte",
    description: "Especialista em resolução de problemas técnicos com sotaque britânico, perfeito para atendimento internacional.",
    category: "Suporte",
    status: "active",
    calls: 94,
    avgTime: "4:05",
    successRate: 81,
    lastActivity: "Ontem às 16:42",
    avatarLetter: "T",
    avatarColor: "bg-green-100",
    voiceId: VOICES.THOMAS, // Voz masculina britânica
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
