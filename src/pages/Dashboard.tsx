
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, PhoneCall, Clock, CheckCircle2, ArrowRight, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentCardProps } from "@/components/agents/AgentCard";
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

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Dados simulados para demonstração de 10 dias de uso
  const simulatedAgents: AgentCardProps[] = [
    {
      id: "9b3f2a1e-8c5d-4f7a-b6e3-d2c1a0f9e8b7",
      name: "Carlos - Vendas B2B",
      category: "Comercial",
      description: "Especializado em qualificação de leads e agendamento de demonstrações para software empresarial",
      status: "active",
      calls: 842,
      avgTime: "2:45",
      successRate: 76,
      successChange: "+4.2%",
      lastActivity: "Hoje, 14:30",
      avatarLetter: "C",
      avatarColor: "bg-blue-100",
      voiceId: VOICES.ROGER
    },
    {
      id: "7d5e6f4c-3b2a-1d9e-8c7f-6b5a4d3c2b1a",
      name: "Mariana - Atendimento ao Cliente",
      category: "Suporte",
      description: "Especializada em resolver dúvidas técnicas e problemas com produtos",
      status: "active",
      calls: 967,
      avgTime: "3:12",
      successRate: 92,
      successChange: "+1.8%",
      lastActivity: "Hoje, 15:15",
      avatarLetter: "M",
      avatarColor: "bg-sky-100",
      voiceId: VOICES.SARAH
    },
    {
      id: "5a4b3c2d-1e9f-8g7h-6i5j-4k3l2m1n0o9p",
      name: "Roberto - Retenção",
      category: "Reengajamento",
      description: "Focado em reativar clientes inativos e reduzir cancelamentos",
      status: "active",
      calls: 513,
      avgTime: "4:05",
      successRate: 68,
      successChange: "+5.7%",
      lastActivity: "Hoje, 13:45",
      avatarLetter: "R",
      avatarColor: "bg-cyan-100",
      voiceId: VOICES.THOMAS
    },
    {
      id: "2z3y4x5w-6v7u-8t9s-0r1q-2p3o4n5m6l7k",
      name: "Ana - Follow-up",
      category: "Comercial",
      description: "Especializada em follow-up após reuniões para fechamento de vendas",
      status: "paused",
      calls: 621,
      avgTime: "1:58",
      successRate: 81,
      successChange: "+3.4%",
      lastActivity: "Ontem, 17:20",
      avatarLetter: "A",
      avatarColor: "bg-teal-100",
      voiceId: VOICES.ARIA
    }
  ];
  
  // Usar os dados simulados em vez de buscar do Supabase para o vídeo
  const { isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      console.log("Simulando busca de agentes para demonstração de vídeo");
      // Simular tempo de carregamento
      await new Promise(resolve => setTimeout(resolve, 300));
      return [];
    },
    enabled: false // Desabilita a query para usar nossos dados simulados
  });

  // Top agentes (versão resumida para não repetir a página completa)
  const topAgents = simulatedAgents.slice(0, 2);

  // Navegar para a página de todos os agentes
  const viewAllAgents = () => {
    navigate('/agents');
  };

  // Navegar para a página de criação de agente
  const handleCreateAgent = () => {
    navigate('/agents/new');
  };

  // Navegar para a página de edição de agente
  const handleAgentEditClick = (id: string) => {
    navigate(`/agents/${id}/edit`);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-700">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Acompanhe o desempenho do seu sistema de atendimento por voz em tempo real.
          </p>
        </div>
        
        {/* Estatísticas do topo - Dados realistas para 10 dias de uso */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 border-border/40 hover:border-blue-200 transition-colors duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total de Chamadas Hoje</p>
                <p className="text-2xl font-bold">254</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <span className="inline-block mr-1">↑</span> 12% em relação a ontem
                </p>
              </div>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <PhoneCall className="w-5 h-5 text-blue-800 dark:text-blue-400" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-border/40 hover:border-blue-200 transition-colors duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Tempo Médio de Chamada</p>
                <p className="text-2xl font-bold">3:24</p>
                <p className="text-xs text-amber-600 flex items-center mt-1">
                  <span className="inline-block mr-1">↔</span> Estável em relação a ontem
                </p>
              </div>
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-border/40 hover:border-blue-200 transition-colors duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Taxa de Sucesso Global</p>
                <p className="text-2xl font-bold">78.5%</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <span className="inline-block mr-1">↑</span> 3.2% em relação a ontem
                </p>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </Card>
        </div>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Agentes Mais Ativos</h2>
            <p className="text-sm text-muted-foreground">
              Agentes com maior volume de chamadas nas últimas 24 horas
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline"
              onClick={viewAllAgents}
              className="flex items-center gap-1 text-sm"
            >
              Ver Todos
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
            
            <Button 
              className="bg-blue-800 hover:bg-blue-900 text-white shadow-sm"
              onClick={handleCreateAgent}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Agente
            </Button>
          </div>
        </div>

        {/* Top agentes cards - Dados simulados mais realistas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
          {isLoading ? (
            <p>Carregando agentes...</p>
          ) : topAgents.length > 0 ? (
            topAgents.map(agent => (
              <Card 
                key={agent.id}
                className="flex p-4 gap-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleAgentEditClick(agent.id)}
              >
                <div className={`${agent.avatarColor} h-12 w-12 rounded-full flex items-center justify-center font-medium text-lg`}>
                  {agent.avatarLetter}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{agent.name}</h3>
                      <p className="text-sm text-muted-foreground">{agent.category}</p>
                    </div>
                    <Badge variant={agent.status === "active" ? "default" : agent.status === "paused" ? "secondary" : "outline"}>
                      {agent.status === "active" ? "Ativo" : agent.status === "paused" ? "Pausado" : "Inativo"}
                    </Badge>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-1">
                    <div>
                      <p className="text-xs text-muted-foreground">Chamadas</p>
                      <p className="font-semibold">{agent.calls}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Sucesso</p>
                      <p className="font-semibold">{agent.successRate}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Tempo Médio</p>
                      <p className="font-semibold">{agent.avgTime}</p>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <p>Nenhum agente ativo encontrado. <Button variant="link" onClick={handleCreateAgent} className="p-0">Criar agente</Button></p>
          )}
        </div>

        {/* Próximos passos com melhorias visuais */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Próximos Passos</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <NextStepCard 
              number={1}
              title="Testar uma chamada real"
              description="Selecione um agente e faça uma ligação para testar o sistema."
              icon={<PhoneCall className="h-5 w-5 text-blue-800 dark:text-blue-400" />}
            />
            
            <NextStepCard 
              number={2}
              title="Adicionar leads"
              description="Importe seus contatos para o sistema realizar chamadas automatizadas."
              icon={<Plus className="h-5 w-5 text-blue-800 dark:text-blue-400" />}
            />
            
            <NextStepCard 
              number={3}
              title="Configurar integrações"
              description="Conecte seu CRM ou outras ferramentas para sincronizar dados."
              icon={<Settings className="h-5 w-5 text-blue-800 dark:text-blue-400" />}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

// NextStepCard component for improved "Próximos Passos"
const NextStepCard = ({ 
  number, 
  title, 
  description, 
  icon 
}: { 
  number: number; 
  title: string; 
  description: string; 
  icon: React.ReactNode 
}) => (
  <div className="bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-all duration-200 group">
    <div className="flex items-start gap-4">
      <div className="relative">
        <div className="bg-blue-100 dark:bg-blue-900/30 p-2.5 rounded-lg">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-800 rounded-full flex items-center justify-center text-xs text-white font-medium">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-800 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {description}
        </p>
      </div>
      <div className="text-muted-foreground transition-transform group-hover:translate-x-1">
        <ChevronRight className="h-5 w-5" />
      </div>
    </div>
  </div>
);

// Utility function for avatar colors
function getAvatarColor(name: string) {
  const colors = [
    "bg-blue-100", "bg-sky-100", "bg-cyan-100", 
    "bg-teal-100", "bg-blue-100", "bg-sky-100",
    "bg-cyan-100", "bg-teal-100", "bg-blue-100"
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}
function getRandomActivity() {
  const activities = [
    "Hoje, 14:30", 
    "Hoje, 15:20", 
    "Hoje, 11:45", 
    "Hoje, 10:15", 
    "Ontem, 17:20"
  ];
  return activities[Math.floor(Math.random() * activities.length)];
}
