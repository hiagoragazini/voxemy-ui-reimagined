
import React from "react";
import { AgentVoiceTester } from "./AgentVoiceTester";
import { ChatSimulator } from "./ChatSimulator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface AgentTesterProps {
  agentId: string;
  agentName: string;
  agentType: "text" | "voice" | "hybrid";
  voiceId?: string | null;
  onClose?: () => void;
}

export function AgentTester({
  agentId,
  agentName,
  agentType,
  voiceId,
  onClose
}: AgentTesterProps) {
  if (agentType === "text") {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">Testar Agente de Texto: {agentName}</h3>
          <p className="text-sm text-muted-foreground">
            Simule uma conversa por chat com este agente
          </p>
        </div>
        <ChatSimulator
          agentName={agentName}
        />
      </div>
    );
  }

  if (agentType === "voice") {
    return (
      <AgentVoiceTester
        agentId={agentId}
        agentName={agentName}
        voiceId={voiceId}
        onClose={onClose}
      />
    );
  }

  // Para agentes híbridos, mostrar abas para testar ambos os canais
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Testar Agente Híbrido: {agentName}</h3>
        <p className="text-sm text-muted-foreground">
          Teste tanto o canal de texto quanto o de voz deste agente
        </p>
      </div>
      
      <Tabs defaultValue="text" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="text">💬 Teste de Chat</TabsTrigger>
          <TabsTrigger value="voice">🎤 Teste de Voz</TabsTrigger>
        </TabsList>
        
        <TabsContent value="text" className="mt-4">
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-medium text-green-800">Modo WhatsApp</h4>
              <p className="text-sm text-green-700">
                Teste como o agente responde via mensagens de texto
              </p>
            </div>
            <ChatSimulator agentName={agentName} />
          </div>
        </TabsContent>
        
        <TabsContent value="voice" className="mt-4">
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800">Modo Chamada</h4>
              <p className="text-sm text-blue-700">
                Teste como o agente se comporta em chamadas telefônicas
              </p>
            </div>
            <AgentVoiceTester
              agentId={agentId}
              agentName={agentName}
              voiceId={voiceId}
              onClose={onClose}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
