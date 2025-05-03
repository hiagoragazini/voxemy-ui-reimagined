
import { useState } from "react";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Plus, Phone, BarChart3, Users, User, Filter } from "lucide-react";
import { toast } from "@/components/ui/sonner";
import { Progress } from "@/components/ui/progress";

// Mock data for the campaigns page
const mockCampaigns = [
  {
    id: "1",
    name: "Campanha Black Friday",
    status: "active",
    totalLeads: 2500,
    completedLeads: 1875,
    agent: "Sofia Atendente",
    lastActivity: "Hoje às 15:30",
    avgCallDuration: "2:10",
    successRate: 79,
    startDate: "20/11/2023",
    endDate: "28/11/2023"
  },
  {
    id: "2",
    name: "Reengajamento Clientes Inativos",
    status: "active",
    totalLeads: 1200,
    completedLeads: 780,
    agent: "Carlos Vendas",
    lastActivity: "Hoje às 14:15",
    avgCallDuration: "3:22",
    successRate: 68,
    startDate: "10/10/2023",
    endDate: "10/12/2023"
  },
  {
    id: "3",
    name: "Cobrança Suave Novembro",
    status: "paused",
    totalLeads: 850,
    completedLeads: 245,
    agent: "Ricardo Cobranças",
    lastActivity: "Ontem às 17:40",
    avgCallDuration: "2:45",
    successRate: 42,
    startDate: "01/11/2023",
    endDate: "30/11/2023"
  },
  {
    id: "4",
    name: "Pesquisa de Satisfação Q4",
    status: "scheduled",
    totalLeads: 3000,
    completedLeads: 0,
    agent: "Juliana Pesquisas",
    lastActivity: "Nunca iniciada",
    avgCallDuration: "-",
    successRate: 0,
    startDate: "01/12/2023",
    endDate: "15/12/2023"
  },
  {
    id: "5",
    name: "Follow-up Leads Quentes",
    status: "completed",
    totalLeads: 500,
    completedLeads: 500,
    agent: "Carlos Vendas",
    lastActivity: "22/10/2023",
    avgCallDuration: "2:58",
    successRate: 88,
    startDate: "01/10/2023",
    endDate: "22/10/2023"
  }
];

export default function Campaigns() {
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "scheduled" | "completed">("all");

  const handleNewCampaign = () => {
    toast.success("Redirecionando para criação de nova campanha...");
    // Aqui seria a navegação real para o formulário de criação
  };

  const handleEditCampaign = (id: string) => {
    toast.success(`Editando campanha ${id}...`);
    // Aqui seria a navegação real para a edição da campanha
  };

  // Filter campaigns based on selected filter
  const filteredCampaigns = mockCampaigns.filter(campaign => {
    if (filter === "all") return true;
    return campaign.status === filter;
  });

  const getFilterCount = (filterType: "active" | "paused" | "scheduled" | "completed") => {
    return mockCampaigns.filter(campaign => campaign.status === filterType).length;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">Ativa</Badge>;
      case "paused":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">Pausada</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">Agendada</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-200 border-0">Concluída</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-violet-500">
            Campanhas de Chamadas
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Configure e gerencie campanhas de chamadas automatizadas para seus agentes de voz.
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
              <span>Todas ({mockCampaigns.length})</span>
            </Button>
            <Button 
              variant={filter === "active" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("active")}
              className="flex items-center gap-1.5"
            >
              <Phone className="h-4 w-4 text-green-500" />
              <span>Ativas ({getFilterCount("active")})</span>
            </Button>
            <Button 
              variant={filter === "paused" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("paused")}
              className="flex items-center gap-1.5"
            >
              <CalendarDays className="h-4 w-4 text-amber-500" />
              <span>Pausadas ({getFilterCount("paused")})</span>
            </Button>
            <Button 
              variant={filter === "scheduled" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("scheduled")}
              className="flex items-center gap-1.5"
            >
              <CalendarDays className="h-4 w-4 text-blue-500" />
              <span>Agendadas ({getFilterCount("scheduled")})</span>
            </Button>
            <Button 
              variant={filter === "completed" ? "default" : "outline"} 
              size="sm"
              onClick={() => setFilter("completed")}
              className="flex items-center gap-1.5"
            >
              <BarChart3 className="h-4 w-4 text-gray-500" />
              <span>Concluídas ({getFilterCount("completed")})</span>
            </Button>
          </div>
          <Button 
            onClick={handleNewCampaign}
            className="bg-violet-600 hover:bg-violet-700 text-white font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCampaigns.map((campaign) => (
            <Card key={campaign.id} className="hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:scale-[1.01] group">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl font-semibold">{campaign.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusBadge(campaign.status)}
                      <span className="text-xs text-muted-foreground">
                        {campaign.startDate} - {campaign.endDate}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-muted-foreground h-8 w-8"
                    onClick={() => handleEditCampaign(campaign.id)}
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="16" 
                      height="16" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center mb-1 text-sm">
                      <span className="text-muted-foreground">Progresso</span>
                      <span className="font-medium">
                        {Math.round((campaign.completedLeads / campaign.totalLeads) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(campaign.completedLeads / campaign.totalLeads) * 100} 
                      className="h-2 bg-gray-100" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Total de Leads</p>
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-violet-500" />
                        <p className="font-semibold">{campaign.totalLeads}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Agente</p>
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-violet-500" />
                        <p className="font-semibold">{campaign.agent}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Tempo Médio</p>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
                        <p className="font-semibold">{campaign.avgCallDuration}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Taxa Sucesso</p>
                      <div className="flex items-center gap-1.5">
                        <BarChart3 className="h-3.5 w-3.5 text-violet-500" />
                        <p className="font-semibold">{campaign.successRate}%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <div className="text-xs text-muted-foreground flex items-center">
                  <CalendarDays className="w-3.5 h-3.5 mr-1 text-gray-400" />
                  <span>Última atividade: {campaign.lastActivity}</span>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </Layout>
  );
}
