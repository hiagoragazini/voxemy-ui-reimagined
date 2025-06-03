
import React from "react";
import { AgentVoiceTester } from "./AgentVoiceTester";
import { ChatSimulator } from "./ChatSimulator";

interface AgentTesterProps {
  agentId: string;
  agentName: string;
  agentType: "text" | "voice";
  voiceId?: string;
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
          onClose={onClose}
        />
      </div>
    );
  }

  return (
    <AgentVoiceTester
      agentId={agentId}
      agentName={agentName}
      voiceId={voiceId}
      onClose={onClose}
    />
  );
}
