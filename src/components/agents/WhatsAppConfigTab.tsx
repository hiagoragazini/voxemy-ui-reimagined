
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, AlertCircle, ExternalLink, Copy, TestTube2 } from "lucide-react";
import { toast } from "sonner";

interface WhatsAppConfigTabProps {
  formState: {
    phoneNumber: string;
    webhookUrl: string;
    defaultGreeting: string;
    maxResponseLength: string;
  };
  onFormChange: (field: string, value: string) => void;
}

export const WhatsAppConfigTab = ({ formState, onFormChange }: WhatsAppConfigTabProps) => {
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'testing' | 'connected'>('disconnected');
  const [testMessage, setTestMessage] = useState('');

  const handleTestConnection = async () => {
    if (!formState.phoneNumber) {
      toast.error("Número do WhatsApp é obrigatório para teste");
      return;
    }

    setConnectionStatus('testing');
    
    // Simular teste de conexão
    setTimeout(() => {
      setConnectionStatus('connected');
      toast.success("Conexão com WhatsApp testada com sucesso!");
    }, 2000);
  };

  const handleCopyWebhook = () => {
    if (formState.webhookUrl) {
      navigator.clipboard.writeText(formState.webhookUrl);
      toast.success("URL do webhook copiada!");
    }
  };

  const handleTestMessage = () => {
    if (!testMessage.trim()) {
      toast.error("Digite uma mensagem para testar");
      return;
    }
    
    if (!formState.phoneNumber) {
      toast.error("Configure o número do WhatsApp primeiro");
      return;
    }

    // Simular envio de mensagem de teste
    toast.success(`Mensagem de teste enviada: "${testMessage}"`);
    setTestMessage('');
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800 border-green-200">Conectado</Badge>;
      case 'testing':
        return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Testando...</Badge>;
      default:
        return <Badge variant="outline">Desconectado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Status da Conexão */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Status da Conexão</CardTitle>
              <CardDescription>Verifique a conectividade com o WhatsApp Business API</CardDescription>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-3">
            {connectionStatus === 'connected' ? (
              <CheckCircle className="h-5 w-5 text-green-600" />
            ) : (
              <AlertCircle className="h-5 w-5 text-orange-500" />
            )}
            <span className="text-sm">
              {connectionStatus === 'connected' 
                ? 'WhatsApp Business API conectado e funcionando'
                : 'Configure as credenciais para conectar ao WhatsApp'
              }
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Configurações Básicas */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações do WhatsApp Business</CardTitle>
          <CardDescription>Configure as credenciais e número do WhatsApp Business API</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-number">Número do WhatsApp Business *</Label>
            <Input
              id="whatsapp-number"
              type="tel"
              value={formState.phoneNumber}
              onChange={(e) => onFormChange('phoneNumber', e.target.value)}
              placeholder="Ex: +5511999999999"
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Número verificado no WhatsApp Business API (formato internacional)
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp-webhook">URL do Webhook</Label>
            <div className="flex gap-2">
              <Input
                id="whatsapp-webhook"
                type="url"
                value={formState.webhookUrl}
                onChange={(e) => onFormChange('webhookUrl', e.target.value)}
                placeholder="https://sua-api.com/webhooks/whatsapp"
                className="font-mono"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyWebhook}
                disabled={!formState.webhookUrl}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              URL para receber mensagens e atualizações de status do WhatsApp
            </p>
          </div>

          <Button
            type="button"
            onClick={handleTestConnection}
            disabled={connectionStatus === 'testing' || !formState.phoneNumber}
            className="w-full"
          >
            {connectionStatus === 'testing' && <TestTube2 className="mr-2 h-4 w-4 animate-pulse" />}
            Testar Conexão
          </Button>
        </CardContent>
      </Card>

      {/* Configurações de Mensagem */}
      <Card>
        <CardHeader>
          <CardTitle>Configurações de Mensagem</CardTitle>
          <CardDescription>Personalize como o agente se comporta no WhatsApp</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="whatsapp-greeting">Mensagem de Boas-vindas</Label>
            <Textarea
              id="whatsapp-greeting"
              value={formState.defaultGreeting}
              onChange={(e) => onFormChange('defaultGreeting', e.target.value)}
              placeholder="Olá! 👋 Sou seu assistente virtual. Como posso ajudar você hoje?"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              Primeira mensagem enviada quando um contato inicia uma conversa
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="whatsapp-max-length">Comprimento Máximo da Resposta</Label>
            <Input
              id="whatsapp-max-length"
              type="number"
              value={formState.maxResponseLength}
              onChange={(e) => onFormChange('maxResponseLength', e.target.value)}
              placeholder="300"
              min="50"
              max="1000"
            />
            <p className="text-xs text-muted-foreground">
              Número máximo de caracteres por mensagem (recomendado: 150-300)
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Teste de Mensagem */}
      <Card>
        <CardHeader>
          <CardTitle>Teste de Mensagem</CardTitle>
          <CardDescription>Envie uma mensagem de teste para validar a configuração</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-message">Mensagem de Teste</Label>
            <Textarea
              id="test-message"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              placeholder="Digite uma mensagem para testar o envio..."
              rows={3}
            />
          </div>

          <Button
            type="button"
            onClick={handleTestMessage}
            disabled={!testMessage.trim() || !formState.phoneNumber}
            variant="outline"
            className="w-full"
          >
            <TestTube2 className="mr-2 h-4 w-4" />
            Enviar Mensagem de Teste
          </Button>

          {connectionStatus === 'connected' && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Agente configurado e pronto para responder mensagens no WhatsApp!
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Links Úteis */}
      <Card>
        <CardHeader>
          <CardTitle>Recursos e Documentação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <a
              href="https://developers.facebook.com/docs/whatsapp/getting-started"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4" />
              Documentação WhatsApp Business API
            </a>
            <a
              href="https://business.whatsapp.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
            >
              <ExternalLink className="h-4 w-4" />
              WhatsApp Business
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
