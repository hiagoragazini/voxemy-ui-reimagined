
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
  const [agents, setAgents] = useState([]);
  const [csvFile, setCsvFile] = useState(null);

  useEffect(() => {
    // Fetch agents
    const fetchAgents = async () => {
      try {
        const { data, error } = await supabase
          .from("agents")
          .select("*")
          .eq("status", "active");

        if (error) throw error;
        setAgents(data || []);
      } catch (err) {
        console.error("Error fetching agents:", err);
        toast.error("Erro ao carregar agentes");
      }
    };

    // If editing, fetch campaign data
    const fetchCampaign = async () => {
      if (isEditing) {
        try {
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
        } catch (err) {
          console.error("Error fetching campaign:", err);
          toast.error("Erro ao carregar dados da campanha");
        }
      }
    };

    fetchAgents();
    fetchCampaign();
  }, [id, isEditing]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    toast.info("Esta funcionalidade será implementada em breve!");
    setLoading(false);
    
    // For now, just redirect back to campaigns list
    navigate("/campaigns");
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCsvFile(e.target.files[0]);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-violet-500">
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
                />
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Formato: nome, telefone
              </p>
            </div>

            <div>
              <Label htmlFor="agent">Agente</Label>
              <Select
                value={formData.agentId}
                onValueChange={(value) => setFormData({...formData, agentId: value})}
              >
                <SelectTrigger id="agent">
                  <SelectValue placeholder="Selecione um agente" />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                className="bg-violet-600 hover:bg-violet-700 text-white"
                disabled={loading}
              >
                {loading ? "Salvando..." : isEditing ? "Salvar Alterações" : "Criar Campanha"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}
