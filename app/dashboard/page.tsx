
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/ui/layout";
import { AgentGrid, getAvatarColor } from "@/components/ui/agent-grid";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, PhoneCall, Clock, CheckCircle2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AgentCardProps } from "@/components/ui/agent-card";

// Dados de exemplo para os agentes baseados na imagem
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
    successChange: "+5.2%",
    lastActivity: "Ontem, 17:20",
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
    successChange: "+5.2%",
    lastActivity: "22/04/2025",
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
    successChange: "+5.2%",
    lastActivity: "",
  }
];

export default function DashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleAgentEditClick = (id: string) => {
    console.log(`Editar agente ${id}`);
    router.push(`/agentes/${id}/editar`);
  };

  const handleCreateAgent = () => {
    console.log("Criar novo agente");
    router.push('/agentes/novo');
  };

  const handleTestVoice = (id: string) => {
    const agent = mockAgents.find(agent => agent.id === id);
    if (agent) {
      console.log(`Iniciando teste de voz para ${agent.name}`);
    }
  };

  // Preparar agentes com avatar letters e cores
  const agentsWithAvatars = mockAgents.map(agent => ({
    ...agent,
    avatarLetter: agent.name.split(' ')[0][0] + (agent.name.split(' ')[1]?.[0] || ''),
    avatarColor: getAvatarColor(agent.name)
  }));

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-violet-500">
            Visão Geral dos seus Agentes de Voz
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Acompanhe seu time de IA em ação e veja o desempenho das chamadas em tempo real.
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

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">Seus Agentes</h2>
            <p className="text-sm text-muted-foreground">
              Gerenciamento e monitoramento de seus assistentes virtuais
            </p>
          </div>
          
          <Button 
            className="bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
            onClick={handleCreateAgent}
          >
            <Plus className="h-4 w-4 mr-1" />
            Novo Agente
          </Button>
        </div>

        <div className="mb-10">
          <AgentGrid 
            agents={agentsWithAvatars}
            isLoading={isLoading}
            onAgentEditClick={handleAgentEditClick}
            onTestVoice={handleTestVoice}
            onCreateAgent={handleCreateAgent}
          />
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

const Settings = (props: React.SVGAttributes<SVGElement>) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
