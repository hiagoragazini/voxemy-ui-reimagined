
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Layout } from "@/components/dashboard/Layout";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/sonner";
import { useAuth } from "@/contexts/AuthContext";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// Define form schema with validation
const businessFormSchema = z.object({
  company_name: z.string().min(2, {
    message: "O nome da empresa deve ter pelo menos 2 caracteres.",
  }),
  business_area: z.string().min(2, {
    message: "A área de atuação deve ter pelo menos 2 caracteres.",
  }),
  products_services: z.string().min(10, {
    message: "Descreva seus produtos ou serviços com pelo menos 10 caracteres.",
  }),
  main_benefits: z.string().min(10, {
    message: "Descreva os benefícios principais com pelo menos 10 caracteres.",
  }),
  sales_arguments: z.string().min(10, {
    message: "Descreva os argumentos de venda com pelo menos 10 caracteres.",
  }),
  common_objections: z.string().min(10, {
    message: "Descreva as objeções comuns com pelo menos 10 caracteres.",
  }),
  tone_of_voice: z.string().min(2, {
    message: "Defina o tom de voz com pelo menos 2 caracteres.",
  }),
});

// Define the TypeScript type for form values
type BusinessFormValues = z.infer<typeof businessFormSchema>;

const Business = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [success, setSuccess] = useState(false);

  // Initialize the form with react-hook-form
  const form = useForm<BusinessFormValues>({
    resolver: zodResolver(businessFormSchema),
    defaultValues: {
      company_name: "",
      business_area: "",
      products_services: "",
      main_benefits: "",
      sales_arguments: "",
      common_objections: "",
      tone_of_voice: "",
    },
  });

  // Load existing business info if available
  useEffect(() => {
    const fetchBusinessInfo = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from("business_info")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) throw error;

        if (data) {
          // Pre-fill form with existing data
          form.reset({
            company_name: data.company_name,
            business_area: data.business_area,
            products_services: data.products_services,
            main_benefits: data.main_benefits,
            sales_arguments: data.sales_arguments,
            common_objections: data.common_objections,
            tone_of_voice: data.tone_of_voice,
          });
        }
      } catch (error: any) {
        console.error("Error fetching business info:", error.message);
        toast.error("Erro ao carregar informações do negócio");
      } finally {
        setInitialLoading(false);
      }
    };

    fetchBusinessInfo();
  }, [user, form]);

  // Submit handler for the form
  const onSubmit = async (values: BusinessFormValues) => {
    if (!user) {
      toast.error("Você precisa estar logado para salvar informações");
      return;
    }

    setLoading(true);
    setSuccess(false);

    try {
      // Check if business info already exists for this user
      const { data: existingData } = await supabase
        .from("business_info")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let operation;
      if (existingData) {
        // Update existing record
        operation = supabase
          .from("business_info")
          .update({
            ...values,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id);
      } else {
        // Insert new record - ensure all required fields are provided
        operation = supabase.from("business_info").insert({
          user_id: user.id,
          company_name: values.company_name,
          business_area: values.business_area,
          products_services: values.products_services,
          main_benefits: values.main_benefits,
          sales_arguments: values.sales_arguments,
          common_objections: values.common_objections,
          tone_of_voice: values.tone_of_voice,
        });
      }

      const { error } = await operation;

      if (error) throw error;

      setSuccess(true);
      toast.success("Informações salvas! Agora sua IA sabe tudo sobre seu negócio.");
    } catch (error: any) {
      console.error("Error saving business info:", error.message);
      toast.error("Erro ao salvar informações");
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Layout>
        <div className="container mx-auto p-6 flex justify-center items-center min-h-[70vh]">
          <Loader2 className="h-8 w-8 animate-spin text-violet-600" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-violet-500">
          Meu Negócio
        </h1>
        <p className="text-muted-foreground mb-8 max-w-3xl">
          Preencha as informações do seu negócio para que a IA possa utilizá-las ao falar com seus leads.
        </p>

        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm p-6 max-w-3xl">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Company Name Field */}
              <FormField
                control={form.control}
                name="company_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Voxemy Tecnologia" {...field} />
                    </FormControl>
                    <FormDescription>
                      O nome oficial da sua empresa.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Business Area Field */}
              <FormField
                control={form.control}
                name="business_area"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Área de atuação</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Tecnologia, Saúde, Educação" {...field} />
                    </FormControl>
                    <FormDescription>
                      O setor ou indústria em que sua empresa atua.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Products/Services Field */}
              <FormField
                control={form.control}
                name="products_services"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Produtos/serviços oferecidos</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ex: Oferecemos software de automação de marketing, consultoria em estratégia digital e implementação de CRM."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Descreva detalhadamente os produtos ou serviços que sua empresa oferece.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Main Benefits Field */}
              <FormField
                control={form.control}
                name="main_benefits"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Benefícios principais</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ex: Economia de tempo, aumento de produtividade, redução de custos operacionais."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Quais são os principais benefícios que seus clientes obtêm.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Sales Arguments Field */}
              <FormField
                control={form.control}
                name="sales_arguments"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Argumentos de venda</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ex: Nossa solução é a única no mercado com integração completa, temos suporte 24/7, garantimos ROI em 3 meses."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Os principais argumentos usados para convencer potenciais clientes.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Common Objections Field */}
              <FormField
                control={form.control}
                name="common_objections"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Objeções comuns</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Ex: 'É muito caro', 'Preciso consultar meu gerente', 'Já uso um produto similar'."
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Objeções típicas que você escuta dos leads e como costuma responder a elas.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tone of Voice Field */}
              <FormField
                control={form.control}
                name="tone_of_voice"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tom de voz</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ex: Profissional, Informal, Divertido, Técnico" 
                        {...field} 
                      />
                    </FormControl>
                    <FormDescription>
                      Como você quer que a IA se comunique com seus leads.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center gap-4 pt-4">
                <Button 
                  type="submit" 
                  disabled={loading}
                  className="bg-violet-600 hover:bg-violet-700"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Salvar Informações
                </Button>
                
                {success && (
                  <p className="text-sm text-green-600 dark:text-green-400">
                    Informações salvas com sucesso!
                  </p>
                )}
              </div>
            </form>
          </Form>
        </div>
      </div>
    </Layout>
  );
};

export default Business;
