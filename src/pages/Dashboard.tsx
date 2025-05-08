import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, PhoneCall, Clock, CheckCircle2, ArrowRight, Settings } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentCardProps } from "@/components/ui/agent-card";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { VOICES } from "../Agents"; // Import the shared VOICES object

export default function Dashboard() {
  const navigate = useNavigate();
  
  // Fetch agents from Supabase
  const { data: agentsData, isLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('status', 'active')
        .limit(3);
      
      if (error) {
        console.error('Error fetching agents:', error);
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

  // Top agentes (versão resumida para não repetir a página completa)
  const topAgents = agents.slice(0, 2);

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
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-violet-500">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Acompanhe o desempenho do seu sistema de atendimento por voz em tempo real.
          </p>
        </div>
        
        {/* Estatísticas do topo */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="p-4 border-border/40 hover:border-violet-200 transition-colors duration-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total de Chamadas Hoje</p>
                <p className="text-2xl font-bold">254</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <span className="inline-block mr-1">↑</span> 12% em relação a ontem
                </p>
              </div>
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-full">
                <PhoneCall className="w-5 h-5 text-violet-700 dark:text-violet-400" />
              </div>
            </div>
          </Card>
          
          <Card className="p-4 border-border/40 hover:border-violet-200 transition-colors duration-200">
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
          
          <Card className="p-4 border-border/40 hover:border-violet-200 transition-colors duration-200">
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
              className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
              onClick={handleCreateAgent}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Agente
            </Button>
          </div>
        </div>

        {/* Top agentes cards */}
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
                    <Badge variant={agent.status === "active" ? "success" : agent.status === "paused" ? "warning" : "outline"}>
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
              icon={<PhoneCall className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
            />
            
            <NextStepCard 
              number={2}
              title="Adicionar leads"
              description="Importe seus contatos para o sistema realizar chamadas automatizadas."
              icon={<Plus className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
            />
            
            <NextStepCard 
              number={3}
              title="Configurar integrações"
              description="Conecte seu CRM ou outras ferramentas para sincronizar dados."
              icon={<Settings className="h-5 w-5 text-violet-600 dark:text-violet-400" />}
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
        <div className="bg-violet-100 dark:bg-violet-900/30 p-2.5 rounded-lg">
          {icon}
        </div>
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-violet-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-violet-700 dark:group-hover:text-violet-400 transition-colors">{title}</h3>
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
    "bg-blue-100", "bg-purple-100", "bg-green-100", 
    "bg-yellow-100", "bg-red-100", "bg-pink-100",
    "bg-indigo-100", "bg-orange-100", "bg-violet-100"
  ];
  
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
}
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
