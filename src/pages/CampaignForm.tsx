
import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import Papa from "papaparse";
import { useQuery } from "@tanstack/react-query";
import { Agent } from "@/integrations/supabase/tables.types";
import { Loader2 } from "lucide-react";

export default function CampaignForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = !!id;
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    agentId: "",
    originPhone: "",
    consent: false,
  });
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<{name: string, phone: string}[]>([]);
  const [csvError, setCsvError] = useState<string | null>(null);
  const [csvIsValid, setCsvIsValid] = useState(false);

  // Fetch agents
  const { data: agents = [], isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("agents")
          .select("*")
          .eq("status", "active");

        if (error) throw error;
        return data as Agent[];
      } catch (err: any) {
        console.error("Error fetching agents:", err);
        toast.error("Erro ao carregar agentes");
        return [];
      }
    }
  });

  // If editing, fetch campaign data
  useEffect(() => {
    const fetchCampaign = async () => {
      if (isEditing) {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from("campaigns")
            .select("*")
            .eq("id", id)
            .single();

          if (error) throw error;
          
          if (data) {
            setFormData({
              name: data.name || "",
              agentId: data.agent_id || "",
              originPhone: data.origin_phone || "",
              consent: true,
            });
          }
        } catch (err: any) {
          console.error("Error fetching campaign:", err);
          toast.error("Erro ao carregar dados da campanha");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchCampaign();
  }, [id, isEditing]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setCsvFile(file);
      
      // Reset validation state
      setCsvError(null);
      setCsvIsValid(false);
      setCsvData([]);
      
      // Parse CSV file
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const { data, errors, meta } = results;
          
          // Check for parsing errors
          if (errors.length > 0) {
            setCsvError("Erro ao analisar o arquivo CSV");
            return;
          }
          
          // Check required headers
          const headers = meta.fields || [];
          const hasName = headers.some(h => 
            h.toLowerCase() === 'nome' || 
            h.toLowerCase() === 'name');
          const hasPhone = headers.some(h => 
            h.toLowerCase() === 'telefone' || 
            h.toLowerCase() === 'phone');
          
          if (!hasName || !hasPhone) {
            setCsvError("CSV deve conter colunas para nome e telefone");
            return;
          }
          
          // Process data
          const processedData: {name: string, phone: string}[] = [];
          let hasInvalidRows = false;
          
          data.forEach((row: any) => {
            const name = row.nome || row.name || row.Nome || row.Name;
            const phone = row.telefone || row.phone || row.Telefone || row.Phone;
            
            if (!name || !phone) {
              hasInvalidRows = true;
              return;
            }
            
            processedData.push({ name, phone });
          });
          
          if (processedData.length === 0) {
            setCsvError("Nenhum lead válido encontrado no arquivo");
            return;
          }
          
          setCsvData(processedData);
          setCsvIsValid(true);
          
          if (hasInvalidRows) {
            toast.warning("Algumas linhas no arquivo CSV foram ignoradas por estarem incompletas");
          } else {
            toast.success(`${processedData.length} leads válidos encontrados`);
          }
        },
        error: (error) => {
          setCsvError(`Erro ao processar arquivo: ${error}`);
        }
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.agentId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    
    if (!csvIsValid && !isEditing) {
      toast.error("Faça upload de um arquivo CSV válido com leads");
      return;
    }
    
    if (!formData.consent) {
      toast.error("Você precisa confirmar que os leads consentiram em receber ligações");
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Create or update campaign
      const campaignData = {
        name: formData.name,
        agent_id: formData.agentId,
        origin_phone: formData.originPhone,
        status: "scheduled",
        start_date: new Date().toISOString(),
        total_leads: isEditing ? undefined : csvData.length,
      };
      
      let campaignId = id;
      
      if (isEditing) {
        // Update existing campaign
        const { error } = await supabase
          .from("campaigns")
          .update(campaignData)
          .eq("id", id);
          
        if (error) throw error;
        toast.success("Campanha atualizada com sucesso!");
      } else {
        // Create new campaign
        const { data, error } = await supabase
          .from("campaigns")
          .insert(campaignData)
          .select("id")
          .single();
          
        if (error) throw error;
        campaignId = data.id;
        
        // 2. Add leads
        if (csvData.length > 0) {
          const leadsToInsert = csvData.map(lead => ({
            campaign_id: campaignId,
            name: lead.name,
            phone: lead.phone,
            status: "pending",
          }));
          
          const { error: leadsError } = await supabase
            .from("leads")
            .insert(leadsToInsert);
            
          if (leadsError) throw leadsError;
        }
        
        toast.success("Campanha criada com sucesso!");
      }
      
      // Redirect to campaigns list
      navigate("/campaigns");
      
    } catch (err: any) {
      console.error("Error saving campaign:", err);
      toast.error(`Erro ao salvar campanha: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-700">
            {isEditing ? "Editar Campanha" : "Nova Campanha"}
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            {isEditing 
              ? "Edite os detalhes da campanha existente." 
              : "Configure uma nova campanha de chamadas automatizadas."}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Nome da Campanha</Label>
              <Input 
                id="name" 
                placeholder="Ex: Black Friday 2023" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            
            <div>
              <Label htmlFor="file">Upload de Leads (CSV)</Label>
              <div className="mt-1">
                <Input 
                  id="file" 
                  type="file" 
                  accept=".csv" 
                  onChange={handleFileChange}
                  disabled={isEditing}
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Formato: nome, telefone
              </p>
              
              {csvError && (
                <p className="text-sm text-red-500 mt-1">
                  {csvError}
                </p>
              )}
              
              {csvIsValid && csvData.length > 0 && (
                <div className="mt-2 p-3 bg-gray-50 rounded border text-sm">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-medium">{csvData.length} leads encontrados</p>
                  </div>
                  {csvData.length > 0 && (
                    <div className="max-h-32 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="p-1 text-left">Nome</th>
                            <th className="p-1 text-left">Telefone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 5).map((lead, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="p-1">{lead.name}</td>
                              <td className="p-1">{lead.phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvData.length > 5 && (
                        <p className="text-center text-xs text-gray-500 mt-2">
                          + {csvData.length - 5} leads não exibidos
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="agent">Agente</Label>
              <Select
                value={formData.agentId}
                onValueChange={(value) => setFormData({...formData, agentId: value})}
                disabled={loading}
              >
                <SelectTrigger id="agent">
                  <SelectValue placeholder="Selecione um agente" />
                </SelectTrigger>
                <SelectContent>
                  {agentsLoading ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span>Carregando...</span>
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="p-2 text-center text-muted-foreground">
                      Nenhum agente disponível
                    </div>
                  ) : (
                    agents.map((agent) => (
                      <SelectItem key={agent.id} value={agent.id}>
                        {agent.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500 mt-1">
                O agente que será utilizado para fazer as chamadas
              </p>
            </div>

            <div>
              <Label htmlFor="phone">Número de Origem</Label>
              <Input 
                id="phone" 
                placeholder="DDD + número (ex: 11999887766)" 
                value={formData.originPhone}
                onChange={(e) => setFormData({...formData, originPhone: e.target.value})}
              />
              <p className="text-sm text-gray-500 mt-1">
                Número que aparecerá para os leads quando receberem a chamada
              </p>
            </div>

            <div className="flex items-start space-x-3 space-y-0 rounded-md border p-4">
              <Checkbox
                id="consent"
                checked={formData.consent}
                onCheckedChange={(checked) => 
                  setFormData({...formData, consent: checked === true})
                }
              />
              <div className="space-y-1 leading-none">
                <Label htmlFor="consent">
                  Todos os leads consentiram em receber ligação
                </Label>
                <p className="text-sm text-gray-500">
                  Confirmo que todos os contatos da lista consentiram em receber ligações
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/campaigns")}
              >
                Cancelar
              </Button>
              
              <Button 
                type="submit"
                className="bg-blue-800 hover:bg-blue-900 text-white"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {isEditing ? "Salvando..." : "Criando..."}
                  </>
                ) : (
                  isEditing ? "Salvar Alterações" : "Criar Campanha"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
