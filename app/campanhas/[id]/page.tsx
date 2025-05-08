
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { 
  ChevronLeft, Loader2, AlertCircle, Phone, Clock,
  Calendar, BarChart3, User, Smartphone 
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Campaign, Lead } from "@/integrations/supabase/tables.types";
import { CampaignActions } from "@/components/campaign/CampaignActions";

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [agentName, setAgentName] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  // Fetch campaign and leads data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch campaign data
        const { data: campaignData, error: campaignError } = await supabase
          .from("campaigns")
          .select("*")
          .eq("id", params.id)
          .single();
        
        if (campaignError) throw campaignError;
        if (!campaignData) throw new Error("Campanha não encontrada");
        
        setCampaign(campaignData);
        
        // Fetch agent name if agent_id is available
        if (campaignData.agent_id) {
          const { data: agentData, error: agentError } = await supabase
            .from("agents")
            .select("name")
            .eq("id", campaignData.agent_id)
            .single();
            
          if (!agentError && agentData) {
            setAgentName(agentData.name);
          }
        }
        
        // Fetch leads data
        const { data: leadsData, error: leadsError } = await supabase
          .from("leads")
          .select("*")
          .eq("campaign_id", params.id)
          .order("created_at", { ascending: true });
        
        if (leadsError) throw leadsError;
        setLeads(leadsData || []);
        
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError(error.message || "Erro ao carregar dados");
        toast.error("Erro ao carregar dados da campanha");
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) {
      fetchData();
    }
  }, [params.id]);

  const handleBack = () => {
    router.push('/campanhas');
  };

  const handleAIDispatch = () => {
    toast.info("Funcionalidade de disparo por IA será implementada em breve!");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-100 text-green-800 font-normal">Ativa</Badge>;
      case "paused":
        return <Badge className="bg-amber-100 text-amber-800 font-normal">Pausada</Badge>;
      case "scheduled":
        return <Badge className="bg-blue-100 text-blue-800 font-normal">Agendada</Badge>;
      case "completed":
        return <Badge className="bg-gray-100 text-gray-800 font-normal">Concluída</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const getLeadStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="text-gray-600 font-normal">Pendente</Badge>;
      case "called":
        return <Badge className="bg-blue-100 text-blue-800 font-normal">Chamado</Badge>;
      case "completed":
        return <Badge className="bg-green-100 text-green-800 font-normal">Concluído</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800 font-normal">Falha</Badge>;
      default:
        return <Badge variant="outline">{status || "Pendente"}</Badge>;
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6 flex justify-center items-center" style={{height: 'calc(100vh - 200px)'}}>
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-4" />
            <p className="text-muted-foreground">Carregando detalhes da campanha...</p>
          </div>
        </div>
      </Layout>
    );
  }

  if (error || !campaign) {
    return (
      <Layout>
        <div className="container mx-auto p-6">
          <div className="flex flex-col items-center justify-center mt-12">
            <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
            <h2 className="text-2xl font-bold text-center mb-2">Erro ao carregar campanha</h2>
            <p className="text-muted-foreground text-center mb-6">{error || "Campanha não encontrada"}</p>
            <Button onClick={handleBack}>Voltar para Campanhas</Button>
          </div>
        </div>
      </Layout>
    );
  }

  const completionPercentage = campaign.total_leads 
    ? Math.round((campaign.completed_leads / campaign.total_leads) * 100) 
    : 0;

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={handleBack}
          className="mb-6 -ml-3"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          <span>Voltar</span>
        </Button>

        <div className="flex flex-col lg:flex-row justify-between gap-6">
          {/* Campaign Details */}
          <div className="w-full lg:w-1/3 bg-white border rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold">{campaign.name}</h2>
              {getStatusBadge(campaign.status)}
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <User className="h-4 w-4 text-violet-600 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Agente</p>
                  <p className="font-medium">{agentName || "Nenhum"}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Smartphone className="h-4 w-4 text-violet-600 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Número de Origem</p>
                  <p className="font-medium">{campaign.origin_phone || "Não definido"}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Phone className="h-4 w-4 text-violet-600 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Total de Leads</p>
                  <p className="font-medium">{campaign.total_leads}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Clock className="h-4 w-4 text-violet-600 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Tempo Médio de Chamada</p>
                  <p className="font-medium">{campaign.avg_call_duration || "N/A"}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-violet-600 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Data de Início</p>
                  <p className="font-medium">
                    {campaign.start_date 
                      ? new Date(campaign.start_date).toLocaleDateString('pt-BR') 
                      : "Não iniciada"}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center">
                <BarChart3 className="h-4 w-4 text-violet-600 mr-3" />
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Sucesso</p>
                  <p className="font-medium">{campaign.success_rate || 0}%</p>
                </div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span>Progresso</span>
                  <span>{completionPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-violet-600 h-2 rounded-full" 
                    style={{ width: `${completionPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="mt-6 pt-4 border-t">
              <div className="flex flex-col gap-3">
                <Button 
                  className="bg-violet-600 hover:bg-violet-700 text-white font-medium"
                  onClick={handleAIDispatch}
                >
                  Disparar via IA
                </Button>
                
                <CampaignActions
                  campaignId={campaign.id}
                  campaignName={campaign.name}
                  agentId={campaign.agent_id || undefined}
                  agentName={agentName}
                />
              </div>
            </div>
          </div>
          
          {/* Leads Table */}
          <div className="w-full lg:w-2/3 bg-white border rounded-lg shadow-sm overflow-hidden">
            <div className="p-4 border-b bg-gray-50">
              <h3 className="font-semibold">Leads ({leads.length})</h3>
            </div>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Duração</TableHead>
                    <TableHead>Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                        Nenhum lead encontrado para esta campanha
                      </TableCell>
                    </TableRow>
                  ) : (
                    leads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.name}</TableCell>
                        <TableCell>{lead.phone}</TableCell>
                        <TableCell>{getLeadStatusBadge(lead.status || "pending")}</TableCell>
                        <TableCell>{lead.call_duration || "-"}</TableCell>
                        <TableCell>{lead.call_result || "-"}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
