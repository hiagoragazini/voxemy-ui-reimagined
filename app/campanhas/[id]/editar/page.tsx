
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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
import { Loader2, AlertCircle, ChevronLeft } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Agent } from "@/integrations/supabase/tables.types";

const formSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  agentId: z.string().min(1, { message: "Selecione um agente" }),
  originPhone: z.string().min(10, { message: "Número inválido" }),
  status: z.enum(["scheduled", "active", "paused", "completed"]),
});

export default function EditarCampanha() {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      agentId: "",
      originPhone: "",
      status: "scheduled" as const,
    },
  });

  // Fetch campaign data and agents on component mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch campaign data
        const { data: campaign, error: campaignError } = await supabase
          .from("campaigns")
          .select("*")
          .eq("id", params.id)
          .single();

        if (campaignError) throw campaignError;
        if (!campaign) throw new Error("Campanha não encontrada");
        
        // Fetch agents
        const { data: agentsData, error: agentsError } = await supabase
          .from("agents")
          .select("*");
          
        if (agentsError) throw agentsError;
        
        setAgents(agentsData || []);
        
        // Set form values
        form.reset({
          name: campaign.name,
          agentId: campaign.agent_id || "",
          originPhone: campaign.origin_phone || "",
          status: campaign.status as any || "scheduled",
        });
        
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError(error.message || "Erro ao carregar dados");
        toast.error("Erro ao carregar dados da campanha");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [params.id, form]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const { error } = await supabase
        .from("campaigns")
        .update({
          name: values.name,
          agent_id: values.agentId,
          origin_phone: values.originPhone,
          status: values.status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);

      if (error) throw error;
      
      setSuccess("Campanha atualizada com sucesso!");
      toast.success("Campanha atualizada com sucesso!");
      
      // Redirect after a brief delay
      setTimeout(() => {
        router.push(`/campanhas/${params.id}`);
      }, 1000);
      
    } catch (error: any) {
      console.error("Error updating campaign:", error);
      setError(error.message || "Erro ao atualizar campanha");
      toast.error(`Erro ao atualizar campanha: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <Layout>
        <div className="container mx-auto p-6 flex justify-center items-center" style={{height: 'calc(100vh - 200px)'}}>
          <div className="flex flex-col items-center">
            <Loader2 className="h-8 w-8 animate-spin text-violet-600 mb-4" />
            <p className="text-muted-foreground">Carregando dados da campanha...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <Button 
          variant="ghost" 
          onClick={handleCancel}
          className="mb-6 -ml-3"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          <span>Voltar</span>
        </Button>

        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-violet-500">
            Editar Campanha
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Atualize as configurações da sua campanha.
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
          <Alert className="mb-6 bg-green-50 text-green-800 border-green-200">
            <AlertTitle>Sucesso</AlertTitle>
            <AlertDescription>{success}</AlertDescription>
          </Alert>
        )}

        <div className="bg-white rounded-lg shadow-sm border p-6 max-w-2xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Campanha</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="agentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Agente</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um agente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {agents.map((agent) => (
                          <SelectItem key={agent.id} value={agent.id}>
                            {agent.name}
                          </SelectItem>
                        ))}
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
                      <Input 
                        placeholder="DDD + número (ex: 11999887766)" 
                        {...field} 
                      />
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
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="scheduled">Agendada</SelectItem>
                        <SelectItem value="active">Ativa</SelectItem>
                        <SelectItem value="paused">Pausada</SelectItem>
                        <SelectItem value="completed">Concluída</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
                
                <Button 
                  type="submit"
                  className="bg-violet-600 hover:bg-violet-700 text-white"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    'Salvar Alterações'
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
