
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Layout } from "@/components/ui/layout";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { FileUploader } from "@/components/ui/file-uploader";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Agent } from "@/integrations/supabase/tables.types";
import Papa from "papaparse";

const formSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  agentId: z.string().min(1, { message: "Selecione um agente" }),
  originPhone: z.string().min(10, { message: "Número inválido" }),
  consent: z.boolean().refine((val) => val === true, {
    message: "Você precisa confirmar o consentimento dos leads",
  }),
});

export default function NovaCampanha() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvParseStatus, setCsvParseStatus] = useState<{
    valid: boolean;
    message: string;
    data: { name: string; phone: string }[];
  }>({
    valid: false,
    message: "",
    data: [],
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      agentId: "",
      originPhone: "",
      consent: false,
    },
  });

  // Fetch agents on component mount
  useState(() => {
    async function fetchAgents() {
      try {
        const { data, error } = await supabase
          .from("agents")
          .select("*")
          .eq("status", "active");

        if (error) throw error;
        
        setAgents(data || []);
      } catch (error) {
        console.error("Error fetching agents:", error);
        toast.error("Erro ao carregar agentes");
      } finally {
        setLoading(false);
      }
    }

    fetchAgents();
  }, []);

  // Function to handle CSV file validation
  const validateCSV = (file: File) => {
    setCsvFile(file);
    setCsvParseStatus({
      valid: false,
      message: "Analisando arquivo...",
      data: [],
    });

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        // Check if the required columns exist
        const headers = results.meta.fields || [];
        const hasNameColumn = headers.includes("nome") || headers.includes("name");
        const hasPhoneColumn = headers.includes("telefone") || headers.includes("phone");
        
        if (!hasNameColumn || !hasPhoneColumn) {
          setCsvParseStatus({
            valid: false,
            message: "O CSV deve conter as colunas 'nome' (ou 'name') e 'telefone' (ou 'phone')",
            data: [],
          });
          return;
        }
        
        // Process and validate data
        const leads: { name: string; phone: string }[] = [];
        let hasInvalidData = false;
        
        results.data.forEach((row: any, index: number) => {
          const name = row.nome || row.name;
          const phone = row.telefone || row.phone;
          
          if (!name || !phone) {
            hasInvalidData = true;
            return;
          }
          
          leads.push({ name, phone });
        });
        
        if (hasInvalidData) {
          setCsvParseStatus({
            valid: false,
            message: "Alguns registros estão incompletos ou inválidos",
            data: leads,
          });
          return;
        }
        
        if (leads.length === 0) {
          setCsvParseStatus({
            valid: false,
            message: "Nenhum lead válido encontrado no arquivo",
            data: [],
          });
          return;
        }
        
        setCsvParseStatus({
          valid: true,
          message: `${leads.length} leads válidos encontrados`,
          data: leads,
        });
      },
      error: (error) => {
        setCsvParseStatus({
          valid: false,
          message: `Erro ao processar arquivo: ${error.message}`,
          data: [],
        });
      }
    });
  };

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    // Verify we have valid CSV data
    if (!csvParseStatus.valid || csvParseStatus.data.length === 0) {
      toast.error("Por favor, faça upload de um CSV válido com leads");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // 1. Create the campaign
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .insert({
          name: values.name,
          agent_id: values.agentId,
          origin_phone: values.originPhone,
          status: "scheduled",
          start_date: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (campaignError) throw campaignError;
      
      // 2. Add the leads
      const campaignId = campaignData.id;
      const leadsToInsert = csvParseStatus.data.map(lead => ({
        campaign_id: campaignId,
        name: lead.name,
        phone: lead.phone,
      }));
      
      const { error: leadsError } = await supabase
        .from("leads")
        .insert(leadsToInsert);
        
      if (leadsError) throw leadsError;
      
      setSuccess("Campanha criada com sucesso!");
      toast.success("Campanha criada com sucesso!");
      
      // Redirect after a brief delay
      setTimeout(() => {
        router.push('/campanhas');
      }, 1000);
      
    } catch (error: any) {
      console.error("Error creating campaign:", error);
      setError(error.message || "Erro ao criar campanha");
      toast.error(`Erro ao criar campanha: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle test call
  const handleTestCall = () => {
    toast.info("Funcionalidade de teste de chamada será implementada em breve!");
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-violet-500">
            Nova Campanha
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Configure uma nova campanha de chamadas automatizadas.
          </p>
        </div>

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {success && (
          <Alert variant="default" className="mb-6 bg-green-50 border-green-200">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <AlertTitle className="text-green-700">Sucesso</AlertTitle>
            <AlertDescription className="text-green-700">{success}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Campanha</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Black Friday 2023" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <div className="text-sm font-medium">Upload de Leads (CSV)</div>
                <FileUploader
                  accept=".csv"
                  maxSize={5}
                  onFileSelect={validateCSV}
                  label="Arraste seu arquivo CSV ou clique para selecionar"
                  description="Formato: nome, telefone"
                />
                
                {csvParseStatus.message && (
                  <div className={`text-sm ${csvParseStatus.valid ? 'text-green-600' : 'text-amber-600'}`}>
                    {csvParseStatus.message}
                  </div>
                )}
                
                {csvParseStatus.valid && csvParseStatus.data.length > 0 && (
                  <div className="bg-gray-50 p-3 rounded border text-sm">
                    <div className="font-medium mb-1">Preview dos leads:</div>
                    <div className="max-h-32 overflow-y-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-1">Nome</th>
                            <th className="text-left p-1">Telefone</th>
                          </tr>
                        </thead>
                        <tbody>
                          {csvParseStatus.data.slice(0, 5).map((lead, idx) => (
                            <tr key={idx} className="border-b border-gray-100">
                              <td className="p-1">{lead.name}</td>
                              <td className="p-1">{lead.phone}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {csvParseStatus.data.length > 5 && (
                        <div className="text-center text-gray-500 mt-2">
                          + {csvParseStatus.data.length - 5} leads não exibidos
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <FormField
                control={form.control}
                name="agentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agente</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um agente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {loading ? (
                          <div className="flex items-center justify-center p-2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
                          </div>
                        ) : agents.length === 0 ? (
                          <div className="p-2 text-sm text-muted-foreground">
                            Nenhum agente encontrado
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="originPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Origem</FormLabel>
                    <FormControl>
                      <Input placeholder="DDD + número (ex: 11999887766)" {...field} />
                    </FormControl>
                    <FormDescription>
                      Número que aparecerá para os leads quando receberem a chamada
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="consent"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Todos os leads consentiram em receber ligação
                      </FormLabel>
                      <FormDescription>
                        Confirmo que todos os contatos da lista consentiram em receber ligações
                      </FormDescription>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestCall}
                >
                  Testar Ligação
                </Button>
                
                <Button 
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  disabled={isSubmitting || !csvParseStatus.valid}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando campanha...
                    </>
                  ) : (
                    'Criar Campanha'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
}
