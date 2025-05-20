import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Plus, Phone, BarChart3, Users, User, Filter, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// Define a type that matches what's coming from the database
interface CampaignData {
  agent_id: string;
  avg_call_duration: string;
  completed_leads: number;
  created_at: string;
  end_date: string;
  id: string;
  name: string;
  origin_phone: string;
  start_date: string;
  status: string;
  success_rate: number;
  total_leads: number;
  updated_at: string;
}

// Define a type for the filtered status
type CampaignStatus = "active" | "paused" | "scheduled" | "completed";
type FilterType = "all" | CampaignStatus;

export default function Campaigns() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterType>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [agentNames, setAgentNames] = useState<Record<string, string>>({});

  // Fetch campaigns data from Supabase
  const { data: campaigns = [] } = useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      setLoading(true);
      setError(null);
      
      try {
        const { data, error } = await supabase
          .from("campaigns")
          .select("*")
          .order("created_at", { ascending: false });
          
        if (error) throw error;
        
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
        
        return data || [];
      } catch (err: any) {
        console.error("Error fetching campaigns:", err);
        setError(err.message || "Erro ao carregar campanhas");
        toast.error("Erro ao carregar campanhas");
        return [];
      } finally {
        setLoading(false);
      }
    }
  });

  const handleNewCampaign = () => {
    // Use navigate to go to the campaign creation page
    navigate('/campaigns/new');
  };

  const handleEditCampaign = (id: string) => {
    navigate(`/campaigns/${id}/edit`);
  };
  
  const handleViewDetails = (id: string) => {
    navigate(`/campaigns/${id}`);
  };

  // Filter campaigns based on selected filter
  const filteredCampaigns = campaigns.filter((campaign: CampaignData) => {
    if (filter === "all") return true;
    return campaign.status === filter;
  });

  const getFilterCount = (filterType: CampaignStatus) => {
    return campaigns.filter((campaign: CampaignData) => campaign.status === filterType).length;
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
              <div className="h-8 w-8 animate-spin text-violet-600 mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"></path>
                </svg>
              </div>
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
            {filteredCampaigns.map((campaign: CampaignData) => {
              const formattedStartDate = campaign.start_date 
                ? new Date(campaign.start_date).toLocaleDateString('pt-BR')
                : "--/--/----";
                
              const formattedEndDate = campaign.end_date
                ? new Date(campaign.end_date).toLocaleDateString('pt-BR')
                : "--/--/----";
                
              const formattedLastActivity = campaign.updated_at
                ? new Date(campaign.updated_at).toLocaleString('pt-BR')
                : "Nunca";
              
              const completionPercentage = campaign.total_leads 
                ? Math.round((campaign.completed_leads / campaign.total_leads) * 100) 
                : 0;
              
              return (
                <Card key={campaign.id} 
                  className="hover:border-primary/30 transition-all duration-300 hover:shadow-md cursor-pointer"
                  onClick={() => handleViewDetails(campaign.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl font-semibold">{campaign.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          {getStatusBadge(campaign.status)}
                          <span className="text-xs text-muted-foreground">
                            {formattedStartDate} - {formattedEndDate}
                          </span>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-muted-foreground h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditCampaign(campaign.id);
                        }}
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
                            {completionPercentage}%
                          </span>
                        </div>
                        <Progress 
                          value={completionPercentage} 
                          className="h-2 bg-gray-100" 
                        />
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Total de Leads</p>
                          <div className="flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-violet-500" />
                            <p className="font-semibold">{campaign.total_leads || 0}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Agente</p>
                          <div className="flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-violet-500" />
                            <p className="font-semibold">{agentNames[campaign.agent_id] || "Sem agente"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Tempo Médio</p>
                          <div className="flex items-center gap-1.5">
                            <CalendarDays className="h-3.5 w-3.5 text-violet-500" />
                            <p className="font-semibold">{campaign.avg_call_duration || "0:00"}</p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Taxa Sucesso</p>
                          <div className="flex items-center gap-1.5">
                            <BarChart3 className="h-3.5 w-3.5 text-violet-500" />
                            <p className="font-semibold">{campaign.success_rate || 0}%</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="text-xs text-muted-foreground flex items-center">
                      <CalendarDays className="w-3.5 h-3.5 mr-1 text-gray-400" />
                      <span>Última atividade: {formattedLastActivity}</span>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="ml-auto"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewDetails(campaign.id);
                      }}
                    >
                      Ver detalhes
                      <ArrowRight className="ml-1 h-4 w-4" />
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </Layout>
  );
}
