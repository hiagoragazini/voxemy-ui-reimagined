
import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ChatSimulator } from "./ChatSimulator";
import { WhatsAppManager } from "@/components/whatsapp/WhatsAppManager";

interface WhatsAppConfigTabProps {
  formState: {
    phoneNumber: string;
    webhookUrl: string;
    defaultGreeting: string;
    maxResponseLength: string;
  };
  onFormChange: (field: string, value: string) => void;
  agentName: string;
  agentId?: string;
  instructions?: string;
  responseStyle?: string;
  knowledge?: string;
}

export function WhatsAppConfigTab({ 
  formState, 
  onFormChange, 
  agentName,
  agentId,
  instructions,
  responseStyle,
  knowledge
}: WhatsAppConfigTabProps) {
  return (
    <div className="space-y-6">
      {/* WhatsApp Connection Manager - Only show for existing agents */}
      {agentId && (
        <WhatsAppManager 
          agentId={agentId} 
          agentName={agentName}
        />
      )}
      
      {/* Configuration and Simulator */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Configurações do WhatsApp */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração do WhatsApp</CardTitle>
              <CardDescription>
                Configure como o agente se comportará no WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phoneNumber">Número do WhatsApp (opcional)</Label>
                <Input 
                  id="phoneNumber"
                  type="tel"
                  value={formState.phoneNumber} 
                  onChange={(e) => onFormChange('phoneNumber', e.target.value)} 
                  placeholder="Ex: +5511999999999"
                />
                <p className="text-xs text-muted-foreground">
                  Número que será usado para enviar mensagens (se aplicável)
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="defaultGreeting">Mensagem de Boas-vindas</Label>
                <Textarea 
                  id="defaultGreeting"
                  value={formState.defaultGreeting} 
                  onChange={(e) => onFormChange('defaultGreeting', e.target.value)} 
                  placeholder="Como o agente deve iniciar uma conversa no WhatsApp"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxResponseLength">Limite de Caracteres por Mensagem</Label>
                <Input 
                  id="maxResponseLength"
                  type="number" 
                  value={formState.maxResponseLength} 
                  onChange={(e) => onFormChange('maxResponseLength', e.target.value)} 
                  placeholder="Máximo de caracteres por mensagem"
                  min="50"
                  max="500"
                />
                <p className="text-xs text-muted-foreground">
                  WhatsApp funciona melhor com mensagens entre 100-200 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhookUrl">URL de Webhook (opcional)</Label>
                <Input 
                  id="webhookUrl"
                  type="url"
                  value={formState.webhookUrl} 
                  onChange={(e) => onFormChange('webhookUrl', e.target.value)} 
                  placeholder="https://seu-dominio.com/webhooks/whatsapp"
                />
                <p className="text-xs text-muted-foreground">
                  URL para receber atualizações de mensagens do WhatsApp
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Simulador de Chat */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Testar Conversa</CardTitle>
              <CardDescription>
                Simule como seria uma conversa com este agente no WhatsApp.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChatSimulator 
                agentName={agentName}
                defaultGreeting={formState.defaultGreeting}
                instructions={instructions}
                responseStyle={responseStyle}
                knowledge={knowledge}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
