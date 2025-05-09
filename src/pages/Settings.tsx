import { useState } from 'react';
import { Layout } from "@/components/dashboard/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

export default function Settings() {
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: "João Silva",
    email: "joao@empresa.com.br",
    company: "Empresa SA",
  });

  const [notificationSettings, setNotificationSettings] = useState({
    email: true,
    push: false,
    sms: false,
    callRecordings: true,
    weekly: true,
    newFeatures: true,
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    setTimeout(() => {
      setLoading(false);
      toast.success("Perfil atualizado com sucesso!");
    }, 1000);
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-blue-700">
            Configurações
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Gerencie suas preferências e configurações da conta.
          </p>
        </div>

        <Tabs defaultValue="profile" className="max-w-4xl">
          <TabsList className="mb-6">
            <TabsTrigger value="profile">Perfil</TabsTrigger>
            <TabsTrigger value="notifications">Notificações</TabsTrigger>
            <TabsTrigger value="billing">Faturamento</TabsTrigger>
            <TabsTrigger value="api">API</TabsTrigger>
          </TabsList>
          
          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Informações do Perfil</CardTitle>
                <CardDescription>
                  Atualize suas informações de perfil.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome</Label>
                    <Input 
                      type="text" 
                      id="name" 
                      value={profileData.name}
                      onChange={(e) => setProfileData({...profileData, name: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      type="email" 
                      id="email" 
                      value={profileData.email}
                      onChange={(e) => setProfileData({...profileData, email: e.target.value})}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company">Empresa</Label>
                    <Input 
                      type="text" 
                      id="company" 
                      value={profileData.company}
                      onChange={(e) => setProfileData({...profileData, company: e.target.value})}
                    />
                  </div>
                  <Button type="submit" disabled={loading}>
                    {loading ? "Salvando..." : "Salvar Perfil"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="notifications" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Preferências de Notificação</CardTitle>
                <CardDescription>
                  Escolha como você gostaria de ser notificado.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications">Email</Label>
                  <Switch 
                    id="email-notifications"
                    checked={notificationSettings.email}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, email: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="push-notifications">Push</Label>
                  <Switch 
                    id="push-notifications"
                    checked={notificationSettings.push}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, push: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="sms-notifications">SMS</Label>
                  <Switch 
                    id="sms-notifications"
                    checked={notificationSettings.sms}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, sms: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="call-recordings">Gravações de Chamadas</Label>
                  <Switch 
                    id="call-recordings"
                    checked={notificationSettings.callRecordings}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, callRecordings: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="weekly-reports">Relatórios Semanais</Label>
                  <Switch 
                    id="weekly-reports"
                    checked={notificationSettings.weekly}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, weekly: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="new-features">Novidades</Label>
                  <Switch 
                    id="new-features"
                    checked={notificationSettings.newFeatures}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, newFeatures: checked})}
                  />
                </div>
                <Button onClick={() => toast.success("Notificações atualizadas!")}>
                  Salvar Notificações
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="billing">
            <Card>
              <CardHeader>
                <CardTitle>Informações de Faturamento</CardTitle>
                <CardDescription>
                  Gerencie suas informações de faturamento e histórico de pagamentos.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Em breve! Aqui você poderá gerenciar suas informações de faturamento.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="api">
            <Card>
              <CardHeader>
                <CardTitle>Chaves de API</CardTitle>
                <CardDescription>
                  Gerencie e gere suas chaves de API para acesso programático.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p>Em breve! Aqui você poderá gerenciar suas chaves de API.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
}
