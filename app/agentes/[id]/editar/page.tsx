
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
import { VOICE_IDS } from "@/constants/voices";

const formSchema = z.object({
  name: z.string().min(3, { message: "Nome deve ter pelo menos 3 caracteres" }),
  description: z.string().optional(),
  category: z.string().min(1, { message: "Selecione uma categoria" }),
  status: z.enum(["active", "paused", "inactive"]),
  voiceId: z.string().min(1, { message: "Selecione uma voz" }),
  instructions: z.string().optional(),
});

export default function EditarAgente() {
  const params = useParams();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(true);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      description: "",
      category: "Geral",
      status: "active" as const,
      voiceId: "",
      instructions: "",
    },
  });

  // Fetch agent data on component mount
  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: agent, error: agentError } = await supabase
          .from("agents")
          .select("*")
          .eq("id", params.id)
          .single();

        if (agentError) throw agentError;
        if (!agent) throw new Error("Agente não encontrado");
        
        // Set form values
        form.reset({
          name: agent.name || "",
          description: agent.description || "",
          category: agent.category || "Geral",
          status: agent.status as any || "active",
          voiceId: agent.voice_id || "",
          instructions: agent.instructions || "",
        });
        
      } catch (error: any) {
        console.error("Error fetching data:", error);
        setError(error.message || "Erro ao carregar dados");
        toast.error("Erro ao carregar dados do agente");
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
        .from("agents")
        .update({
          name: values.name,
          description: values.description,
          category: values.category,
          status: values.status,
          voice_id: values.voiceId,
          instructions: values.instructions,
          updated_at: new Date().toISOString(),
        })
        .eq("id", params.id);

      if (error) throw error;
      
      setSuccess("Agente atualizado com sucesso!");
      toast.success("Agente atualizado com sucesso!");
      
      // Redirect after a brief delay
      setTimeout(() => {
        router.push(`/agentes?updated=true&id=${params.id}`);
      }, 1000);
      
    } catch (error: any) {
      console.error("Error updating agent:", error);
      setError(error.message || "Erro ao atualizar agente");
      toast.error(`Erro ao atualizar agente: ${error.message}`);
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
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-4" />
            <p className="text-muted-foreground">Carregando dados do agente...</p>
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
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500">
            Editar Agente
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Atualize as configurações do seu agente de voz.
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
                    <FormLabel>Nome do Agente</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva a função deste agente" 
                        className="resize-none" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Categoria</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione uma categoria" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Geral">Geral</SelectItem>
                          <SelectItem value="Comercial">Comercial</SelectItem>
                          <SelectItem value="Suporte">Suporte</SelectItem>
                          <SelectItem value="Vendas">Vendas</SelectItem>
                          <SelectItem value="Atendimento">Atendimento ao Cliente</SelectItem>
                          <SelectItem value="Cobrança">Cobrança</SelectItem>
                        </SelectContent>
                      </Select>
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
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="paused">Pausado</SelectItem>
                          <SelectItem value="inactive">Inativo</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="voiceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Voz do Agente</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma voz" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {VOICE_IDS && VOICE_IDS.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name} {voice.language === "pt-BR" ? "(Português)" : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Escolha a voz que melhor representa seu agente
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="instructions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Instruções para o Agente</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Instruções detalhadas sobre como o agente deve se comportar" 
                        className="min-h-[120px]" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Forneça contexto e diretrizes para o comportamento do seu agente durante as chamadas
                    </FormDescription>
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
                  className="bg-blue-600 hover:bg-blue-700 text-white"
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
