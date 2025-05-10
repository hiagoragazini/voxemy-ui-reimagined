
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LeadsTable } from "@/components/campaign/LeadsTable";
import { CampaignActions } from "@/components/campaign/CampaignActions";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Calendar, Phone, AlertCircle, ArrowLeft, ListFilter, BarChart3, Users } from "lucide-react";
import { Campaign, Agent } from "@/integrations/supabase/tables.types";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function CampaignDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [agent, setAgent] = useState<Agent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("leads");

  useEffect(() => {
    if (!id) return;
    
    const fetchCampaignDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch campaign data
        const { data: campaignData, error: campaignError } = await supabase
          .from("campaigns")
          .select("*")
          .eq("id", id)
          .single();
          
        if (campaignError) throw campaignError;
        
        setCampaign(campaignData);
        
        // Fetch agent data if available
        if (campaignData.agent_id) {
          const { data: agentData, error: agentError } = await supabase
            .from("agents")
            .select("*")
            .eq("id", campaignData.agent_id)
            .single();
            
          if (agentError) console.error("Error fetching agent:", agentError);
          else setAgent(agentData);
        }
        
      } catch (err: any) {
        console.error("Error fetching campaign details:", err);
        setError(err.message || "Erro ao carregar detalhes da campanha");
        toast.error("Erro ao carregar detalhes da campanha");
      } finally {
        setLoading(false);
      }
    };
    
    fetchCampaignDetails();
  }, [id]);

  const handleEditClick = () => {
    navigate(`/campaigns/${id}/edit`);
  };

  const handleStatusChange = async (newStatus: Campaign['status']) => {
    if (!campaign) return;
    
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ status: newStatus })
        .eq("id", campaign.id);
        
      if (error) throw error;
      
      setCampaign({ ...campaign, status: newStatus });
      toast.success(`Status alterado para ${getStatusText(newStatus)}`);
    } catch (err: any) {
      console.error("Error updating campaign status:", err);
      toast.error("Erro ao atualizar status da campanha");
    }
  };

  const getStatusBadge = (status: Campaign['status']) => {
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

  const getStatusText = (status: Campaign['status']) => {
    switch (status) {
      case "active": return "Ativa";
      case "paused": return "Pausada";
      case "scheduled": return "Agendada";
      case "completed": return "Concluída";
      default: return status;
    }
  };

  const renderStatusActions = () => {
    if (!campaign) return null;
    
    switch (campaign.status) {
      case "scheduled":
        return (
          <Button 
            variant="outline" 
            className="border-green-500 text-green-700 hover:bg-green-50"
            onClick={() => handleStatusChange("active")}
          >
            <Phone className="h-4 w-4 mr-2" />
            Iniciar Campanha
          </Button>
        );
      case "active":
        return (
          <Button
            variant="outline"
            className="border-amber-500 text-amber-700 hover:bg-amber-50"
            onClick={() => handleStatusChange("paused")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Pausar Campanha
          </Button>
        );
      case "paused":
        return (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="border-green-500 text-green-700 hover:bg-green-50"
              onClick={() => handleStatusChange("active")}
            >
              <Phone className="h-4 w-4 mr-2" />
              Retomar
            </Button>
            <Button
              variant="outline"
              className="border-gray-500 text-gray-700 hover:bg-gray-50"
              onClick={() => handleStatusChange("completed")}
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Finalizar
            </Button>
          </div>
        );
      case "completed":
        return (
          <Button
            variant="outline"
            className="border-amber-500 text-amber-700 hover:bg-amber-50"
            onClick={() => handleStatusChange("scheduled")}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Reagendar
          </Button>
        );
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Carregando detalhes da campanha...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !campaign) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold mb-2">Erro ao carregar campanha</h2>
            <p className="text-muted-foreground mb-6">{error || "Campanha não encontrada"}</p>
            <Button onClick={() => navigate("/campaigns")}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para Campanhas
            </Button>
          </div>
        </div>
      </Layout>
    );
  }

  const completionPercentage = campaign.total_leads 
    ? Math.round((campaign.completed_leads / campaign.total_leads) * 100) 
    : 0;

  const formattedStartDate = campaign.start_date 
    ? new Date(campaign.start_date).toLocaleDateString('pt-BR')
    : "--/--/----";
    
  const formattedEndDate = campaign.end_date
    ? new Date(campaign.end_date).toLocaleDateString('pt-BR')
    : "--/--/----";

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4 mb-6">
          <div>
            <Button 
              variant="ghost" 
              className="mb-2 -ml-4 text-muted-foreground"
              onClick={() => navigate("/campaigns")}
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Voltar para Campanhas
            </Button>
            <h1 className="text-2xl font-bold tracking-tight">
              {campaign.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              {getStatusBadge(campaign.status)}
              <span className="text-sm text-muted-foreground">
                {formattedStartDate} - {formattedEndDate}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {renderStatusActions()}
            <CampaignActions
              campaignId={campaign.id}
              campaignName={campaign.name}
              agentId={campaign.agent_id || undefined}
              agentName={agent?.name}
              onEditClick={handleEditClick}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Progresso
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{completionPercentage}%</div>
              <Progress value={completionPercentage} className="h-2 mt-2" />
              <div className="flex justify-between mt-2 text-sm">
                <div>{campaign.completed_leads} completos</div>
                <div>{campaign.total_leads} total</div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Taxa de Sucesso
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{campaign.success_rate || 0}%</div>
              <div className="flex items-center mt-2">
                <BarChart3 className="h-5 w-5 text-blue-700 mr-2" />
                <span className="text-sm">
                  Baseado nas chamadas completadas
                </span>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Tempo Médio
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="text-2xl font-bold">{campaign.avg_call_duration || "0:00"}</div>
              <div className="flex items-center mt-2">
                <Phone className="h-5 w-5 text-blue-700 mr-2" />
                <span className="text-sm">
                  Duração média das chamadas
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="leads" className="flex items-center">
              <Users className="h-4 w-4 mr-2" />
              <span>Leads</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span>Analytics</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center">
              <ListFilter className="h-4 w-4 mr-2" />
              <span>Configurações</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="leads" className="pt-4">
            <LeadsTable 
              campaignId={campaign.id} 
              agentId={campaign.agent_id || undefined}
              agentName={agent?.name} 
            />
          </TabsContent>
          
          <TabsContent value="analytics" className="pt-4">
            <div className="border rounded-lg p-8 text-center">
              <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">Analytics em desenvolvimento</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                A visualização detalhada de métricas e análises estará disponível em breve.
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="settings" className="pt-4">
            <div className="border rounded-lg p-8 text-center">
              <ListFilter className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">Configurações avançadas em desenvolvimento</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Configurações avançadas para gerenciamento de campanha estarão disponíveis em breve.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
      </div>
    </Layout>
  );
}
