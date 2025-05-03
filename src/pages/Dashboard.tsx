
import { useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { AgentGrid, getAvatarColor } from "@/components/agents/AgentGrid";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";

// Dados de exemplo para os agentes baseados na imagem
const mockAgents = [
  {
    id: "1",
    name: "Assistente de Vendas",
    category: "Comercial",
    description: "Agente inteligente para atendimento e qualificação de leads de vendas.",
    status: "active" as const,
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
    status: "active" as const,
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
    status: "paused" as const,
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
    status: "inactive" as const,
    calls: 0,
    avgTime: "0:00",
    successRate: 0,
    successChange: "+5.2%",
    lastActivity: "",
  }
];

const Dashboard = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const handleAgentEditClick = (id: string) => {
    toast.info(`Editar agente ${id}`);
    // Implementação real abriria um modal ou redirecionaria para página de edição
  };

  const handleCreateAgent = () => {
    toast.info("Criar novo agente");
    // Implementação real abriria um modal ou redirecionaria para página de criação
  };

  const handleTestVoice = (id: string) => {
    const agent = mockAgents.find(agent => agent.id === id);
    if (agent) {
      toast.success(`Iniciando teste de voz para ${agent.name}`);
    }
  };

  // Preparar agentes com avatar letters e cores
  const agentsWithAvatars = mockAgents.map(agent => ({
    ...agent,
    avatarLetter: agent.name.split(' ')[0][0] + (agent.name.split(' ')[1]?.[0] || ''),
    avatarColor: getAvatarColor(agent.name)
  }));

  return (
    <div className="flex h-screen">
      <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebar} />
      
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300",
        sidebarCollapsed ? "ml-[60px]" : "ml-[240px]"
      )}>
        <Header 
          openSidebar={toggleSidebar}
          userName="Usuário"
          sidebarCollapsed={sidebarCollapsed}
        />
        
        <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="mt-1 text-muted-foreground">
                  Gerencie seus agentes de voz e veja o desempenho das chamadas.
                </p>
              </div>
              
              <Button 
                className="bg-violet-600 hover:bg-violet-700 text-white"
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

            {/* Próximos passos */}
            <div className="mb-6">
              <h2 className="text-xl font-bold mb-4">Próximos Passos</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-violet-100 dark:bg-violet-900/30 p-2 rounded-lg">
                      <PhoneCallIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Testar uma chamada real</h3>
                      <p className="text-sm text-muted-foreground">
                        Selecione um agente e faça uma ligação para testar o sistema.
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-violet-100 dark:bg-violet-900/30 p-2 rounded-lg">
                      <Plus className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Adicionar leads</h3>
                      <p className="text-sm text-muted-foreground">
                        Importe seus contatos para o sistema realizar chamadas automatizadas.
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
                
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="bg-violet-100 dark:bg-violet-900/30 p-2 rounded-lg">
                      <SettingsIcon className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium">Configurar integrações</h3>
                      <p className="text-sm text-muted-foreground">
                        Conecte seu CRM ou outras ferramentas para sincronizar dados.
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

// Components para ícones customizados
const PhoneCallIcon = (props: React.SVGAttributes<SVGElement>) => (
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
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
);

const SettingsIcon = (props: React.SVGAttributes<SVGElement>) => (
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

export default Dashboard;
