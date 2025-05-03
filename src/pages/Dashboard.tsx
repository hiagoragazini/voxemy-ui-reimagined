
import { useState } from "react";
import { Header } from "@/components/dashboard/Header";
import { AgentGrid } from "@/components/agents/AgentGrid";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "@/components/ui/sonner";

// Dados de exemplo para os agentes
const mockAgents = [
  {
    id: "1",
    name: "Assistente de Vendas",
    description: "Agente inteligente para atendimento e qualificação de leads de vendas.",
    status: "active" as const,
    usagePercentage: 75,
    lastUpdated: "10/04/2023"
  },
  {
    id: "2",
    name: "Atendimento ao Cliente",
    description: "Responde dúvidas e resolve problemas de clientes automaticamente.",
    status: "active" as const,
    usagePercentage: 45,
    lastUpdated: "08/04/2023"
  },
  {
    id: "3",
    name: "Gestor de Conteúdo",
    description: "Cria e otimiza conteúdo para blogs, redes sociais e email marketing.",
    status: "pending" as const,
    usagePercentage: 10,
    lastUpdated: "20/04/2023"
  },
  {
    id: "4",
    name: "Analista de Dados",
    description: "Processa e analisa dados para insights de negócios e recomendações.",
    status: "inactive" as const,
    usagePercentage: 0,
    lastUpdated: "01/04/2023"
  },
  {
    id: "5",
    name: "Tradutor Multilíngue",
    description: "Traduz e adapta conteúdo para diferentes idiomas e contextos culturais.",
    status: "active" as const,
    usagePercentage: 60,
    lastUpdated: "15/04/2023"
  },
  {
    id: "6",
    name: "Onboarding de Usuários",
    description: "Guia novos usuários durante o processo inicial de uso da plataforma.",
    status: "active" as const,
    usagePercentage: 80,
    lastUpdated: "18/04/2023"
  }
];

const Dashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleOpenSidebar = () => {
    setIsSidebarOpen(true);
  };

  const handleAgentEditClick = (id: string) => {
    toast.info(`Editar agente ${id}`);
    // Implementação real abriria um modal ou redirecionaria para página de edição
  };

  return (
    <div className="flex h-screen flex-col bg-background">
      <Header openSidebar={handleOpenSidebar} userName="John Doe" />
      
      <main className="flex-1 overflow-y-auto">
        <div className="container mx-auto p-4 py-6">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Seus Agentes</h1>
              <p className="mt-1 text-muted-foreground">
                Gerencie e monitore seus agentes inteligentes
              </p>
            </div>
            
            <Button className="gap-1">
              <Plus className="h-4 w-4" />
              Novo Agente
            </Button>
          </div>
          
          <div className="space-y-6">
            <div className="rounded-lg border border-border/40 bg-card p-4 shadow-sm">
              <h2 className="mb-4 text-lg font-medium">Agentes Ativos</h2>
              <AgentGrid 
                agents={mockAgents} 
                isLoading={isLoading}
                onAgentEditClick={handleAgentEditClick}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
