
import { useState, useEffect } from "react";
import { Layout } from "@/components/dashboard/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Check,
  Crown,
  CreditCard,
  User,
  UserCheck,
  Settings as SettingsIcon,
  Upload,
  Phone,
  Database,
  Bot,
  ExternalLink,
} from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [managePlanLoading, setManagePlanLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    role: ""
  });

  // Carregar dados do perfil do usuário
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.user_metadata?.full_name?.split(' ')[0] || "",
        lastName: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || "",
        email: user.email || "",
        company: user.user_metadata?.company || "Empresa",
        role: user.user_metadata?.role || "Diretor"
      });
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleSaveProfile = async () => {
    setProfileLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          full_name: `${formData.firstName} ${formData.lastName}`,
          company: formData.company,
          role: formData.role
        }
      });

      if (error) throw error;
      toast.success("Perfil atualizado com sucesso!");
    } catch (error: any) {
      toast.error(`Erro ao atualizar perfil: ${error.message}`);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCheckout = async (planType: string) => {
    setCheckoutLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout', {
        body: { planType }
      });

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (error: any) {
      toast.error(`Erro ao iniciar checkout: ${error.message}`);
      setCheckoutLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setManagePlanLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('customer-portal');

      if (error) throw error;
      
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL do portal não retornada");
      }
    } catch (error: any) {
      toast.error(`Erro ao acessar portal: ${error.message}`);
    } finally {
      setManagePlanLoading(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-500">
            Configurações
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Gerencie seu perfil, plano e integrações da sua conta.
          </p>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              <span>Conta</span>
            </TabsTrigger>
            <TabsTrigger value="plan" className="flex items-center gap-2">
              <Crown className="h-4 w-4" />
              <span>Plano</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="flex items-center gap-2">
              <SettingsIcon className="h-4 w-4" />
              <span>Integrações</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Atualize suas informações pessoais e dados de contato
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <User className="h-8 w-8" />
                    </div>
                    <div>
                      <Button variant="outline" size="sm" className="mb-1">
                        <Upload className="h-4 w-4 mr-2" />
                        Alterar foto
                      </Button>
                      <p className="text-xs text-muted-foreground">
                        PNG, JPG ou GIF. Máximo 1MB.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nome</Label>
                    <Input 
                      id="firstName" 
                      value={formData.firstName} 
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input 
                      id="lastName" 
                      value={formData.lastName}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    value={formData.email} 
                    disabled
                    className="bg-slate-100"
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input 
                      id="company" 
                      value={formData.company}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Cargo</Label>
                    <Input 
                      id="role" 
                      value={formData.role}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-6">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={handleSaveProfile} disabled={profileLoading}>
                  {profileLoading ? "Salvando..." : "Salvar alterações"}
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Notificações</CardTitle>
                <CardDescription>
                  Configure suas preferências de notificação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Notificações por email</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba atualizações sobre suas campanhas por email
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Alertas de desempenho</Label>
                    <p className="text-sm text-muted-foreground">
                      Seja notificado quando campanhas não atingirem metas
                    </p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Newsletter mensal</Label>
                    <p className="text-sm text-muted-foreground">
                      Receba novidades e dicas para melhorar seus resultados
                    </p>
                  </div>
                  <Switch />
                </div>
              </CardContent>
              <CardFooter className="border-t p-6">
                <Button variant="outline" className="w-full">
                  Salvar preferências
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="plan" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      Plano Atual
                      <Badge className="bg-blue-100 text-blue-800 border-0">Pro</Badge>
                    </CardTitle>
                    <CardDescription>
                      Você está no plano Pro com faturamento mensal
                    </CardDescription>
                  </div>
                  <CreditCard className="h-10 w-10 text-blue-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="font-medium mb-1 flex items-center">
                      <UserCheck className="h-4 w-4 mr-2 text-blue-700" />
                      Agentes de Voz
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">5 de 10 utilizados</span>
                      <span className="text-sm font-medium">50%</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-1.5 mt-1">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "50%" }}></div>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="font-medium mb-1 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-blue-700" />
                      Horas de Chamadas
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">24 de 50 utilizadas</span>
                      <span className="text-sm font-medium">48%</span>
                    </div>
                    <div className="w-full bg-blue-100 rounded-full h-1.5 mt-1">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: "48%" }}></div>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <h3 className="text-lg font-semibold mb-2 flex items-center">
                    <Crown className="h-5 w-5 mr-2 text-amber-500" />
                    Recursos Inclusos no Plano Pro
                  </h3>
                  <div className="grid gap-2 md:grid-cols-2">
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Até 10 agentes de voz</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">50 horas de chamadas/mês</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Estatísticas avançadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Campanhas ilimitadas</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">API de integração</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">Suporte prioritário</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Alterar seu plano</h3>
                  
                  <div className="grid gap-6 md:grid-cols-3">
                    <Card className="border-2 border-transparent hover:border-blue-300 transition-all">
                      <CardHeader className="pb-3">
                        <CardTitle>Inicial</CardTitle>
                        <div className="text-2xl font-bold">R$99<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>3 agentes de voz</span>
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>20 horas de chamadas</span>
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>Estatísticas básicas</span>
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>Suporte por email</span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={() => handleCheckout('basic')} variant="outline" className="w-full">
                          Fazer Downgrade
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card className="border-2 border-blue-500 relative">
                      <div className="absolute -top-3 left-0 right-0 flex justify-center">
                        <Badge className="bg-blue-500 text-white">Seu plano atual</Badge>
                      </div>
                      <CardHeader className="pb-3">
                        <CardTitle>Pro</CardTitle>
                        <div className="text-2xl font-bold">R$199<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>10 agentes de voz</span>
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>50 horas de chamadas</span>
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>Estatísticas avançadas</span>
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>Suporte prioritário</span>
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>API de integração</span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={handleManageSubscription} disabled={managePlanLoading} className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100">
                          {managePlanLoading ? "Carregando..." : "Gerenciar Plano"}
                        </Button>
                      </CardFooter>
                    </Card>
                    
                    <Card className="border-2 border-transparent hover:border-blue-300 transition-all">
                      <CardHeader className="pb-3">
                        <CardTitle>Enterprise</CardTitle>
                        <div className="text-2xl font-bold">R$399<span className="text-sm font-normal text-muted-foreground">/mês</span></div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>Agentes ilimitados</span>
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>100 horas de chamadas</span>
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>Estatísticas premium</span>
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>Suporte VIP</span>
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>API avançada</span>
                          </li>
                          <li className="flex items-center">
                            <Check className="h-4 w-4 mr-2 text-green-500" />
                            <span>Integrações personalizadas</span>
                          </li>
                        </ul>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={() => handleCheckout('enterprise')} variant="default" className="w-full bg-blue-600 hover:bg-blue-700">
                          Fazer Upgrade
                        </Button>
                      </CardFooter>
                    </Card>
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-4">Histórico de Faturas</h3>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Recibo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell>10/05/2024</TableCell>
                        <TableCell>R$ 199,00</TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-800 border-0">Pago</Badge></TableCell>
                        <TableCell className="text-right"><Button variant="link" size="sm">Visualizar</Button></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>10/04/2024</TableCell>
                        <TableCell>R$ 199,00</TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-800 border-0">Pago</Badge></TableCell>
                        <TableCell className="text-right"><Button variant="link" size="sm">Visualizar</Button></TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell>10/03/2024</TableCell>
                        <TableCell>R$ 199,00</TableCell>
                        <TableCell><Badge className="bg-green-100 text-green-800 border-0">Pago</Badge></TableCell>
                        <TableCell className="text-right"><Button variant="link" size="sm">Visualizar</Button></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
              <CardFooter className="border-t p-6 flex flex-col gap-2">
                <Button variant="outline" className="w-full">
                  Ver histórico completo de faturas
                </Button>
              </CardFooter>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Cancelamento</CardTitle>
                <CardDescription>
                  Informações sobre como cancelar sua assinatura
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Você pode cancelar sua assinatura a qualquer momento através do portal de cliente.
                  Após o cancelamento, você terá acesso ao serviço até o final do período faturado atual.
                </p>
              </CardContent>
              <CardFooter className="border-t p-6">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="w-full">
                      Cancelar assinatura
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Você tem certeza?</DialogTitle>
                      <DialogDescription>
                        Ao cancelar sua assinatura, você perderá acesso a todos os recursos premium
                        após o término do período atual. Esta ação não pode ser desfeita.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="gap-2">
                      <Button variant="outline">Voltar</Button>
                      <Button variant="destructive" onClick={handleManageSubscription}>
                        Confirmar Cancelamento
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="integrations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Integrações Disponíveis</CardTitle>
                <CardDescription>
                  Configure integrações com outros sistemas e ferramentas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-lg border p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                        <Database className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">CRM</h3>
                        <p className="text-sm text-muted-foreground">Conecte com seu sistema de CRM</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-0">Conectado</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Sincronizando contatos a cada 30 minutos. Última atualização: hoje às 15:42.
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm">
                      Configurar
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-blue-100 rounded-md flex items-center justify-center text-blue-600">
                        <Phone className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">VoIP</h3>
                        <p className="text-sm text-muted-foreground">Integração com sistema telefônico</p>
                      </div>
                    </div>
                    <Badge className="bg-green-100 text-green-800 border-0">Conectado</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Sistema de telefonia conectado e operacional. 3 linhas configuradas.
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="outline" size="sm">
                      Configurar
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-neutral-100 rounded-md flex items-center justify-center text-neutral-600">
                        <Bot className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">Chatbot</h3>
                        <p className="text-sm text-muted-foreground">Integre com chatbots do seu site</p>
                      </div>
                    </div>
                    <Badge variant="outline">Não conectado</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Conecte seu chatbot para oferecer atendimento complementar ao dos agentes de voz.
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="default" size="sm">
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Conectar
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border p-4">
                  <div className="flex justify-between items-center mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-neutral-100 rounded-md flex items-center justify-center text-neutral-600">
                        <ExternalLink className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">Webhooks</h3>
                        <p className="text-sm text-muted-foreground">Configura webhooks e callbacks</p>
                      </div>
                    </div>
                    <Badge variant="outline">Não conectado</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Receba notificações em tempo real sobre eventos de chamadas nos seus sistemas.
                  </div>
                  <div className="flex justify-end mt-4">
                    <Button variant="default" size="sm">
                      <SettingsIcon className="h-4 w-4 mr-2" />
                      Conectar
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="border-t p-6">
                <Button variant="outline" className="w-full">
                  Ver todas as integrações disponíveis
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
