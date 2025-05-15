
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, PhoneCall, Clock, CheckCircle2, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAgents } from "@/hooks/use-agents";

export default function DashboardPage() {
  const router = useRouter();
  const { 
    agents, 
    isLoading, 
    isRefreshing,
    handleManualRefresh 
  } = useAgents();

  // Get top agents for dashboard display - use the same agents data from the Agents page
  const topAgents = agents.slice(0, 2);

  // Navegar para a página de todos os agentes
  const viewAllAgents = () => {
    router.push('/agentes');
  };

  // Navegar para a página de criação de agente
  const handleCreateAgent = () => {
    console.log("Redirecionando para criação de novo agente...");
    router.push('/agentes/novo');
  };

  // Navegar para a página de edição de agente
  const handleAgentEditClick = (id: string) => {
    router.push(`/agentes/${id}/editar`);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
            Dashboard
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Acompanhe o desempenho do seu sistema de atendimento por voz em tempo real.
          </p>
        </div>
        
        {/* Estatísticas do topo */}
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
                <PhoneCall className="w-5 h-5 text-blue-700 dark:text-blue-400" />
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
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              onClick={handleCreateAgent}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo Agente
            </Button>
          </div>
        </div>

        {/* Top agentes cards - usando dados reais em vez de mock */}
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
            <Card className="col-span-2 p-8 text-center">
              <p className="mb-4 text-muted-foreground">Nenhum agente encontrado. Crie seu primeiro agente para começar.</p>
              <Button onClick={handleCreateAgent} className="bg-blue-600 hover:bg-blue-700">
                <Plus className="h-4 w-4 mr-1" />
                Criar Novo Agente
              </Button>
            </Card>
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
              icon={<PhoneCall className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            />
            
            <NextStepCard 
              number={2}
              title="Adicionar leads"
              description="Importe seus contatos para o sistema realizar chamadas automatizadas."
              icon={<Plus className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
            />
            
            <NextStepCard 
              number={3}
              title="Configurar integrações"
              description="Conecte seu CRM ou outras ferramentas para sincronizar dados."
              icon={<Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
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
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-blue-600 rounded-full flex items-center justify-center text-xs text-white font-medium">
          {number}
        </div>
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900 dark:text-gray-100 group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{title}</h3>
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
