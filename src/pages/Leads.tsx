
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Plus, Search, Filter, Mail, Phone, 
  Calendar, Download, Upload, Trash2, Edit, MoreHorizontal, TagIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

// Interface para os dados do lead
interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company?: string;
  status: string;
  source: string;
  tags?: string[];
  created_at: string;
  last_contact?: string;
}

// Mock para demonstração inicial
const mockLeads: Lead[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao.silva@empresa.com",
    phone: "(11) 98765-4321",
    company: "Tech Solutions",
    status: "new",
    source: "website",
    tags: ["interessado", "produto A"],
    created_at: "2025-05-10T14:30:00Z",
    last_contact: "2025-05-12T10:15:00Z"
  },
  {
    id: "2",
    name: "Maria Souza",
    email: "maria.souza@negocio.com.br",
    phone: "(21) 97654-3210",
    company: "Marketing Pro",
    status: "contacted",
    source: "referral",
    tags: ["orçamento", "produto B"],
    created_at: "2025-05-08T09:20:00Z",
    last_contact: "2025-05-14T16:45:00Z"
  },
  {
    id: "3",
    name: "Carlos Mendes",
    email: "carlos@consultoria.com",
    phone: "(31) 98877-6655",
    company: "Consultoria Express",
    status: "qualified",
    source: "linkedin",
    tags: ["alta prioridade"],
    created_at: "2025-05-05T11:10:00Z",
    last_contact: "2025-05-13T14:30:00Z"
  },
  {
    id: "4",
    name: "Ana Beatriz",
    email: "ana.b@startup.co",
    phone: "(47) 99988-7766",
    status: "negotiation",
    source: "event",
    created_at: "2025-05-01T15:40:00Z",
    last_contact: "2025-05-11T09:00:00Z"
  },
  {
    id: "5",
    name: "Roberto Almeida",
    email: "roberto.almeida@grande.com.br",
    phone: "(19) 98765-1234",
    company: "Empresa Grande Ltda",
    status: "lost",
    source: "cold_call",
    created_at: "2025-04-28T10:30:00Z",
    last_contact: "2025-05-08T11:20:00Z"
  },
];

export default function Leads() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLeads, setSelectedLeads] = useState<Set<string>>(new Set());
  const [currentTab, setCurrentTab] = useState("all");
  
  // Função para buscar leads do Supabase
  const { isLoading, error, refetch } = useQuery({
    queryKey: ['leads'],
    queryFn: async () => {
      try {
        // Na implementação real, usaríamos o código abaixo
        // Temporariamente estamos usando mock data
        /*
        const { data, error } = await supabase
          .from("leads")
          .select("*")
          .order("created_at", { ascending: false });
        
        if (error) throw error;
        return data || [];
        */
        
        // Simula um delay de carregamento para demonstração
        await new Promise(resolve => setTimeout(resolve, 800));
        return mockLeads;
      } catch (err) {
        console.error("Erro ao buscar leads:", err);
        throw err;
      }
    }
  });
  
  // Atualize os leads quando os dados da consulta forem carregados
  useEffect(() => {
    if (!isLoading && !error) {
      // Define mock leads para demonstração
      setLeads(mockLeads);
    }
  }, [isLoading, error]);
  
  // Filtra leads com base na pesquisa
  const filteredLeads = leads.filter(lead => {
    const matchesSearch = 
      searchTerm === "" || 
      lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (lead.company && lead.company.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Filtra pelo tab atual
    if (currentTab === "all") return matchesSearch;
    return matchesSearch && lead.status === currentTab;
  });
  
  // Função para selecionar/desselecionar todos os leads
  const toggleSelectAll = () => {
    if (selectedLeads.size === filteredLeads.length) {
      setSelectedLeads(new Set());
    } else {
      setSelectedLeads(new Set(filteredLeads.map(lead => lead.id)));
    }
  };
  
  // Função para alternar a seleção de um lead
  const toggleLeadSelection = (id: string) => {
    const newSelection = new Set(selectedLeads);
    if (newSelection.has(id)) {
      newSelection.delete(id);
    } else {
      newSelection.add(id);
    }
    setSelectedLeads(newSelection);
  };
  
  // Navegar para página de importação
  const handleImportLeads = () => {
    navigate('/leads/import');
  };
  
  // Função para obter a badge de status
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "new":
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">Novo</Badge>;
      case "contacted":
        return <Badge className="bg-sky-100 text-sky-800 hover:bg-sky-200 border-0">Contatado</Badge>;
      case "qualified":
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200 border-0">Qualificado</Badge>;
      case "negotiation":
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">Em Negociação</Badge>;
      case "won":
        return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0">Convertido</Badge>;
      case "lost":
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-0">Perdido</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };
  
  // Formatar data em formato amigável
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-700">
              Leads
            </h1>
            <p className="text-muted-foreground max-w-2xl">
              Gerencie todos os seus potenciais clientes em um só lugar
            </p>
          </div>
          
          <div className="flex space-x-3">
            <Button
              variant="outline"
              onClick={handleImportLeads}
            >
              <Upload className="h-4 w-4 mr-2" />
              Importar
            </Button>
            <Button
              onClick={() => navigate('/leads/new')}
              className="bg-blue-800 hover:bg-blue-900 text-white"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>
        
        {/* Métricas de leads */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Total de Leads</p>
            <p className="text-2xl font-bold">256</p>
            <p className="text-xs text-green-600">+12 esta semana</p>
          </Card>
          
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Leads Qualificados</p>
            <p className="text-2xl font-bold">89</p>
            <p className="text-xs text-green-600">34.7% do total</p>
          </Card>
          
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
            <p className="text-2xl font-bold">18.3%</p>
            <p className="text-xs text-amber-600">0.5% vs último mês</p>
          </Card>
          
          <Card className="p-4">
            <p className="text-sm text-muted-foreground">Leads sem Contato</p>
            <p className="text-2xl font-bold">42</p>
            <p className="text-xs text-red-600">Precisa atenção</p>
          </Card>
        </div>
        
        <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm mb-6">
          {/* Filtragem e pesquisa */}
          <div className="p-4 border-b flex items-center justify-between flex-wrap gap-3">
            <div className="relative w-full md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar leads..."
                className="pl-9 w-full"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-1" />
                Filtros
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    Ações
                    <MoreHorizontal className="h-4 w-4 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Ações em massa</DropdownMenuLabel>
                  <DropdownMenuItem disabled={selectedLeads.size === 0}>
                    <Mail className="h-4 w-4 mr-2" />
                    Enviar email
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={selectedLeads.size === 0}>
                    <Phone className="h-4 w-4 mr-2" />
                    Adicionar à campanha
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={selectedLeads.size === 0}>
                    <TagIcon className="h-4 w-4 mr-2" />
                    Adicionar tags
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={selectedLeads.size === 0}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir selecionados
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-1" />
                Exportar
              </Button>
            </div>
          </div>
          
          {/* Tabs para status dos leads */}
          <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab} className="w-full">
            <div className="px-4 border-b">
              <TabsList className="h-10">
                <TabsTrigger value="all" className="px-3">Todos</TabsTrigger>
                <TabsTrigger value="new" className="px-3">Novos</TabsTrigger>
                <TabsTrigger value="contacted" className="px-3">Contatados</TabsTrigger>
                <TabsTrigger value="qualified" className="px-3">Qualificados</TabsTrigger>
                <TabsTrigger value="negotiation" className="px-3">Em Negociação</TabsTrigger>
                <TabsTrigger value="won" className="px-3">Convertidos</TabsTrigger>
                <TabsTrigger value="lost" className="px-3">Perdidos</TabsTrigger>
              </TabsList>
            </div>
            
            <TabsContent value={currentTab} className="mt-0">
              {isLoading ? (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                </div>
              ) : (
                <div className="relative overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[40px]">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-gray-300"
                            checked={filteredLeads.length > 0 && selectedLeads.size === filteredLeads.length}
                            onChange={toggleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Nome / Empresa</TableHead>
                        <TableHead>Contato</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Origem</TableHead>
                        <TableHead>Data de cadastro</TableHead>
                        <TableHead>Último contato</TableHead>
                        <TableHead className="w-[60px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredLeads.length > 0 ? (
                        filteredLeads.map((lead) => (
                          <TableRow key={lead.id} className="hover:bg-muted/50 cursor-pointer">
                            <TableCell>
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300"
                                checked={selectedLeads.has(lead.id)}
                                onChange={() => toggleLeadSelection(lead.id)}
                                onClick={(e) => e.stopPropagation()}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{lead.name}</span>
                                {lead.company && (
                                  <span className="text-sm text-muted-foreground">{lead.company}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="text-sm">{lead.email}</span>
                                <span className="text-sm text-muted-foreground">{lead.phone}</span>
                              </div>
                            </TableCell>
                            <TableCell>{getStatusBadge(lead.status)}</TableCell>
                            <TableCell>
                              <span className="capitalize">{lead.source.replace('_', ' ')}</span>
                            </TableCell>
                            <TableCell>{formatDate(lead.created_at)}</TableCell>
                            <TableCell>
                              {lead.last_contact ? formatDate(lead.last_contact) : '-'}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" className="h-8 w-8 p-0">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem>
                                    <Edit className="h-4 w-4 mr-2" />
                                    Editar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Phone className="h-4 w-4 mr-2" />
                                    Ligar
                                  </DropdownMenuItem>
                                  <DropdownMenuItem>
                                    <Mail className="h-4 w-4 mr-2" />
                                    Enviar email
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="text-red-600 hover:text-red-600">
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Excluir
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="h-32 text-center">
                            <div className="flex flex-col items-center justify-center">
                              <p className="text-muted-foreground mb-2">Nenhum lead encontrado</p>
                              <Button
                                variant="outline"
                                size="sm"
                                className="mt-2"
                                onClick={() => navigate('/leads/new')}
                              >
                                <Plus className="h-4 w-4 mr-2" />
                                Adicionar lead
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
