import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Phone, Clock, CheckCircle2, XCircle, BarChart3, Loader2, Pause, RefreshCw, Play, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export default function CallsMonitoring() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [callLogs, setCallLogs] = useState<any[]>([]);
  const [activeCampaigns, setActiveCampaigns] = useState<any[]>([]);
  const [refreshInterval, setRefreshInterval] = useState<number | null>(30); // Auto-refresh every 30 seconds
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState("active-calls");
  const [filter, setFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Set up auto-refresh
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (refreshInterval) {
      interval = setInterval(() => {
        fetchData();
        setLastRefresh(new Date());
      }, refreshInterval * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [refreshInterval]);
  
  // Initial data load
  useEffect(() => {
    fetchData();
  }, []);
  
  // Fetch call logs and active campaigns
  const fetchData = async () => {
    setIsLoading(true);
    
    try {
      // Fetch recent call logs
      const { data: logs, error: logsError } = await supabase
        .from("call_logs")
        .select(`
          *,
          agents:agent_id(*),
          campaigns:campaign_id(*),
          leads:lead_id(*)
        `)
        .order("recorded_at", { ascending: false })
        .limit(100);
        
      if (logsError) throw logsError;
      
      // Fetch active campaigns
      const { data: campaigns, error: campaignsError } = await supabase
        .from("campaigns")
        .select(`
          *,
          agents:agent_id(*)
        `)
        .eq("status", "active");
        
      if (campaignsError) throw campaignsError;
      
      setCallLogs(logs || []);
      setActiveCampaigns(campaigns || []);
    } catch (err: any) {
      console.error("Erro ao buscar dados:", err);
      toast.error("Erro ao buscar dados de chamadas: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };
  
  // Format duration in seconds
  const formatDuration = (seconds: number | null) => {
    if (seconds === null) return "-";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in-progress":
        return "bg-blue-100 text-blue-800";
      case "ringing":
      case "queued":
        return "bg-amber-100 text-amber-800";
      case "busy":
      case "failed":
      case "no-answer":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "in-progress":
        return <Phone className="h-4 w-4 text-blue-600" />;
      case "ringing":
      case "queued":
        return <Clock className="h-4 w-4 text-amber-600" />;
      case "busy":
      case "failed":
      case "no-answer":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-600" />;
    }
  };
  
  // Run a specific campaign now
  const runCampaignNow = async (campaignId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("campaign-executor", {
        body: {
          campaignId,
          maxCalls: 5,
          dryRun: false
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.success) {
        toast.success(
          `Campanha executada: ${data.processedLeads || 0} leads processados`,
          { duration: 5000 }
        );
        
        // Refresh data after a short delay
        setTimeout(fetchData, 2000);
      } else {
        throw new Error(data?.error || "Erro ao executar campanha");
      }
    } catch (err: any) {
      console.error("Erro ao executar campanha:", err);
      toast.error("Erro ao executar campanha: " + (err.message || "Erro desconhecido"));
    }
  };
  
  // Change campaign status
  const changeCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("campaigns")
        .update({ status: newStatus })
        .eq("id", campaignId);
        
      if (error) throw error;
      
      toast.success(`Status da campanha alterado para ${newStatus}`);
      fetchData();
    } catch (err: any) {
      console.error("Erro ao alterar status:", err);
      toast.error("Erro ao alterar status: " + err.message);
    }
  };
  
  // Monitor call page - filter visible logs
  const filteredLogs = callLogs.filter(log => {
    // Apply text filter
    const textMatch = !filter || 
      log.call_sid?.toLowerCase().includes(filter.toLowerCase()) ||
      log.from_number?.toLowerCase().includes(filter.toLowerCase()) ||
      log.to_number?.toLowerCase().includes(filter.toLowerCase()) ||
      log.agents?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      log.leads?.name?.toLowerCase().includes(filter.toLowerCase()) ||
      log.campaigns?.name?.toLowerCase().includes(filter.toLowerCase());
      
    // Apply status filter
    const statusMatch = statusFilter === "all" || log.status === statusFilter;
    
    return textMatch && statusMatch;
  });
  
  // Calculate time until next refresh
  const timeUntilRefresh = () => {
    if (!refreshInterval) return "Manual";
    
    const nextRefresh = new Date(lastRefresh.getTime() + refreshInterval * 1000);
    const now = new Date();
    const secondsLeft = Math.max(0, Math.round((nextRefresh.getTime() - now.getTime()) / 1000));
    
    return `${secondsLeft}s`;
  };
  
  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Monitoramento de Chamadas
            </h1>
            <p className="text-muted-foreground">
              Acompanhe o status de chamadas em tempo real e gerencie campanhas ativas
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center text-sm text-muted-foreground">
              <Clock className="h-4 w-4 mr-1" />
              <span>Próxima atualização: {timeUntilRefresh()}</span>
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={fetchData}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span className="sr-only">Atualizar</span>
            </Button>
            
            <Select
              value={refreshInterval?.toString() || "0"}
              onValueChange={(value) => setRefreshInterval(parseInt(value) || null)}
            >
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Atualização" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Manual</SelectItem>
                <SelectItem value="10">10 segundos</SelectItem>
                <SelectItem value="30">30 segundos</SelectItem>
                <SelectItem value="60">1 minuto</SelectItem>
                <SelectItem value="300">5 minutos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active-calls">
              <Phone className="h-4 w-4 mr-2" />
              <span>Chamadas Recentes</span>
            </TabsTrigger>
            <TabsTrigger value="active-campaigns">
              <BarChart3 className="h-4 w-4 mr-2" />
              <span>Campanhas Ativas</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="active-calls" className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <Input
                placeholder="Filtrar chamadas..."
                className="mb-2 sm:mb-0"
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
              />
              <Select
                value={statusFilter}
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  <SelectItem value="completed">Completadas</SelectItem>
                  <SelectItem value="in-progress">Em andamento</SelectItem>
                  <SelectItem value="ringing">Chamando</SelectItem>
                  <SelectItem value="queued">Na fila</SelectItem>
                  <SelectItem value="failed">Falha</SelectItem>
                  <SelectItem value="busy">Ocupado</SelectItem>
                  <SelectItem value="no-answer">Sem resposta</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[10%]">Status</TableHead>
                    <TableHead className="w-[15%]">Horário</TableHead>
                    <TableHead className="w-[15%]">Duração</TableHead>
                    <TableHead className="w-[15%]">De</TableHead>
                    <TableHead className="w-[15%]">Para</TableHead>
                    <TableHead className="w-[15%]">Agente</TableHead>
                    <TableHead className="w-[15%]">Campanha/Lead</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center">
                        <div className="flex justify-center items-center py-4">
                          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          <span className="ml-2">Carregando chamadas...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-6 text-muted-foreground">
                        Nenhuma chamada encontrada com os filtros atuais
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getStatusIcon(log.status)}
                            <Badge className={getStatusColor(log.status)}>
                              {log.status}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{formatDate(log.recorded_at)}</TableCell>
                        <TableCell>{formatDuration(log.duration)}</TableCell>
                        <TableCell>{log.from_number}</TableCell>
                        <TableCell>{log.to_number}</TableCell>
                        <TableCell>
                          {log.agents?.name || "-"}
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span>{log.campaigns?.name || "-"}</span>
                            {log.leads?.name && (
                              <span className="text-xs text-muted-foreground">
                                Lead: {log.leads.name}
                              </span>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
          
          <TabsContent value="active-campaigns" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {isLoading ? (
              <Card className="col-span-2">
                <CardContent className="flex justify-center items-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
                  <span>Carregando campanhas ativas...</span>
                </CardContent>
              </Card>
            ) : activeCampaigns.length === 0 ? (
              <Card className="col-span-2">
                <CardContent className="flex flex-col justify-center items-center py-8">
                  <p className="text-muted-foreground mb-3">Nenhuma campanha ativa encontrada</p>
                  <Button onClick={() => navigate("/campaigns")}>
                    Ver todas as campanhas
                  </Button>
                </CardContent>
              </Card>
            ) : (
              activeCampaigns.map(campaign => (
                <Card key={campaign.id}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-lg">{campaign.name}</CardTitle>
                      <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Agente: {campaign.agents?.name || "Sem agente"}
                    </p>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="text-center p-2 bg-blue-50 rounded">
                        <p className="text-xs text-muted-foreground">Total de Leads</p>
                        <p className="text-xl font-semibold">{campaign.total_leads || 0}</p>
                      </div>
                      <div className="text-center p-2 bg-green-50 rounded">
                        <p className="text-xs text-muted-foreground">Completados</p>
                        <p className="text-xl font-semibold">{campaign.completed_leads || 0}</p>
                      </div>
                      <div className="text-center p-2 bg-amber-50 rounded">
                        <p className="text-xs text-muted-foreground">Taxa de Sucesso</p>
                        <p className="text-xl font-semibold">{campaign.success_rate || 0}%</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 justify-center pt-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => runCampaignNow(campaign.id)}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Executar Agora
                      </Button>
                      <Button
                        variant="outline" 
                        size="sm"
                        onClick={() => changeCampaignStatus(campaign.id, "paused")}
                      >
                        <Pause className="h-4 w-4 mr-1" />
                        Pausar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/campaigns/${campaign.id}`)}
                      >
                        Ver Detalhes
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
