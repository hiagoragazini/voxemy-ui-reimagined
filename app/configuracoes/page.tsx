
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Layout } from "@/components/ui/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  User, 
  Crown, 
  CreditCard, 
  UserCheck, 
  Settings, 
  Upload, 
  Phone, 
  Database, 
  Bot, 
  ExternalLink,
  Check
} from "lucide-react";

export default function ConfiguracoesPage() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSaveProfile = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      console.log("Perfil atualizado com sucesso!");
    }, 1000);
  };

  const handleUpgrade = () => {
    console.log("Redirecionando para página de planos...");
    router.push('/planos');
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-violet-500">
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
              <Settings className="h-4 w-4" />
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
                    <div className="h-16 w-16 rounded-full bg-violet-100 flex items-center justify-center text-violet-600">
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
                    <Input id="firstName" defaultValue="João" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input id="lastName" defaultValue="Silva" />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" defaultValue="joao.silva@exemplo.com" />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="company">Empresa</Label>
                    <Input id="company" defaultValue="Minhas Vendas Ltda." />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Cargo</Label>
                    <Input id="role" defaultValue="Diretor Comercial" />
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-6">
                <Button variant="outline">Cancelar</Button>
                <Button onClick={handleSaveProfile} disabled={loading}>
                  {loading ? "Salvando..." : "Salvar alterações"}
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
                      <Badge className="bg-violet-100 text-violet-800 border-0">Pro</Badge>
                    </CardTitle>
                    <CardDescription>
                      Você está no plano Pro com faturamento mensal
                    </CardDescription>
                  </div>
                  <CreditCard className="h-10 w-10 text-violet-500" />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="bg-violet-50 rounded-lg p-4">
                    <div className="font-medium mb-1 flex items-center">
                      <UserCheck className="h-4 w-4 mr-2 text-violet-700" />
                      Agentes de Voz
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">5 de 10 utilizados</span>
                      <span className="text-sm font-medium">50%</span>
                    </div>
                    <div className="w-full bg-violet-100 rounded-full h-1.5 mt-1">
                      <div className="bg-violet-600 h-1.5 rounded-full" style={{ width: "50%" }}></div>
                    </div>
                  </div>
                  <div className="bg-violet-50 rounded-lg p-4">
                    <div className="font-medium mb-1 flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-violet-700" />
                      Horas de Chamadas
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground text-sm">24 de 50 utilizadas</span>
                      <span className="text-sm font-medium">48%</span>
                    </div>
                    <div className="w-full bg-violet-100 rounded-full h-1.5 mt-1">
                      <div className="bg-violet-600 h-1.5 rounded-full" style={{ width: "48%" }}></div>
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
              </CardContent>
              <CardFooter className="border-t p-6 flex flex-col gap-2">
                <Button className="w-full bg-violet-600 hover:bg-violet-700" onClick={handleUpgrade}>
                  <Crown className="h-4 w-4 mr-2" />
                  Alterar para Plano Enterprise
                </Button>
                <Button variant="outline" className="w-full">
                  Ver histórico de faturas
                </Button>
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
                      <div className="h-10 w-10 bg-violet-100 rounded-md flex items-center justify-center text-violet-600">
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
                      <Settings className="h-4 w-4 mr-2" />
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
                      <Settings className="h-4 w-4 mr-2" />
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
