"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { CalendarDays, Plus, Phone, BarChart3, Filter, Loader2 } from "lucide-react";
import { CampaignCard } from "@/components/ui/campaign-card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Campaign } from "@/integrations/supabase/tables.types";

export default function CampanhasPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<"all" | "active" | "paused" | "scheduled" | "completed">("all");
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentNames, setAgentNames] = useState<Record<string, string>>({});

  // Fetch campaigns on component mount
  useEffect(() => {
    async function fetchCampaigns() {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        
        setCampaigns(data || []);
        
        // Get agent IDs to fetch their names
        const agentIds = Array.from(new Set(data?.filter(c => c.agent_id).map(c => c.agent_id) || []));
        
        if (agentIds.length > 0) {
          const { data: agentsData, error: agentsError } = await supabase
            .from("agents")
            .select("id, name")
            .in("id", agentIds);
            
          if (!agentsError && agentsData) {
            const namesMap: Record<string, string> = {};
            agentsData.forEach(agent => {
              if (agent.id) {
                namesMap[agent.id] = agent.name;
              }
            });
            setAgentNames(namesMap);
          }
        }
      } catch (err: any) {
        console.error("Error fetching campaigns:", err);
        setError(err.message || "Erro ao carregar campanhas");
        toast.error("Erro ao carregar campanhas");
      } finally {
        setLoading(false);
      }
    }
    
    fetchCampaigns();
  }, []);

  const handleNewCampaign = () => {
    router.push('/campanhas/nova');
  };

  const handleEditCampaign = (id: string) => {
    router.push(`/campanhas/${id}/editar`);
  };
  
  const handleViewDetails = (id: string) => {
    router.push(`/campanhas/${id}`);
  };

  // Filter campaigns based on selected filter
  const filteredCampaigns = campaigns.filter(campaign => {
    if (filter === "all") return true;
    return campaign.status === filter;
  });

  const getFilterCount = (filterType: "active" | "paused" | "scheduled" | "completed") => {
    return campaigns.filter(campaign => campaign.status === filterType).length;
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-4xl font-bold text-blue-700">
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
              <span>Todas ({campaigns.length})</span>
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
            className="bg-blue-800 hover:bg-blue-900 text-white font-medium flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nova Campanha
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-4" />
              <p className="text-muted-foreground">Carregando campanhas...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="text-red-500 mb-2">Erro ao carregar campanhas</div>
            <p className="text-muted-foreground text-center">{error}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => window.location.reload()}
            >
              Tentar novamente
            </Button>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="border-2 border-dashed rounded-lg p-12 text-center">
            <h3 className="font-medium text-lg mb-2">Nenhuma campanha encontrada</h3>
            <p className="text-muted-foreground mb-6">
              {filter === "all" 
                ? "Crie sua primeira campanha para começar a realizar chamadas automatizadas." 
                : "Não há campanhas com o filtro selecionado."}
            </p>
            {filter === "all" && (
              <Button onClick={handleNewCampaign}>
                <Plus className="h-4 w-4 mr-1" />
                <span>Nova Campanha</span>
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCampaigns.map((campaign) => {
              const formattedStartDate = campaign.start_date 
                ? new Date(campaign.start_date).toLocaleDateString('pt-BR')
                : "--/--/----";
                
              const formattedEndDate = campaign.end_date
                ? new Date(campaign.end_date).toLocaleDateString('pt-BR')
                : "--/--/----";
                
              const formattedLastActivity = campaign.updated_at
                ? new Date(campaign.updated_at).toLocaleString('pt-BR')
                : "Nunca";
              
              return (
                <CampaignCard 
                  key={campaign.id}
                  id={campaign.id}
                  name={campaign.name}
                  status={campaign.status as any}
                  totalLeads={campaign.total_leads || 0}
                  completedLeads={campaign.completed_leads || 0}
                  agent={agentNames[campaign.agent_id || ""] || "Sem agente"}
                  agentId={campaign.agent_id || undefined}
                  lastActivity={formattedLastActivity}
                  avgCallDuration={campaign.avg_call_duration || "0:00"}
                  successRate={campaign.success_rate || 0}
                  startDate={formattedStartDate}
                  endDate={formattedEndDate}
                  onEditClick={handleEditCampaign}
                  onViewDetails={handleViewDetails}
                />
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
