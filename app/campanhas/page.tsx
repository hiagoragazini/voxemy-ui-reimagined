
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, Phone, BarChart3, Filter } from "lucide-react";
import { CampaignCard } from "@/components/ui/campaign-card";

// Mock data for the campaigns page
const mockCampaigns = [
  {
    id: "1",
    name: "Campanha Black Friday",
    status: "active" as const,
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
    status: "active" as const,
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
    status: "paused" as const,
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
    status: "scheduled" as const,
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
    status: "completed" as const,
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

export default function CampanhasPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "scheduled" | "completed">("all");

  const handleNewCampaign = () => {
    console.log("Redirecionando para criação de nova campanha...");
    router.push('/campanhas/nova');
  };

  const handleEditCampaign = (id: string) => {
    console.log(`Editando campanha ${id}...`);
    router.push(`/campanhas/${id}/editar`);
  };
  
  const handleViewDetails = (id: string) => {
    console.log(`Visualizando detalhes da campanha ${id}...`);
    router.push(`/campanhas/${id}`);
  };

  // Filter campaigns based on selected filter
  const filteredCampaigns = mockCampaigns.filter(campaign => {
    if (filter === "all") return true;
    return campaign.status === filter;
  });

  const getFilterCount = (filterType: "active" | "paused" | "scheduled" | "completed") => {
    return mockCampaigns.filter(campaign => campaign.status === filterType).length;
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
            <CampaignCard 
              key={campaign.id}
              id={campaign.id}
              name={campaign.name}
              status={campaign.status}
              totalLeads={campaign.totalLeads}
              completedLeads={campaign.completedLeads}
              agent={campaign.agent}
              lastActivity={campaign.lastActivity}
              avgCallDuration={campaign.avgCallDuration}
              successRate={campaign.successRate}
              startDate={campaign.startDate}
              endDate={campaign.endDate}
              onEditClick={handleEditCampaign}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
}
