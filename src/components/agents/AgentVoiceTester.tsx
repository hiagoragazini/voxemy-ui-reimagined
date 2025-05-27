
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { useVoiceCall } from "@/hooks/use-voice-call";

interface AgentVoiceTesterProps {
  agentName?: string;
  agentId?: string;
  assistantId?: string;
  onClose?: () => void;
}

export function AgentVoiceTester({
  agentName = "Agente",
  agentId,
  assistantId,
  onClose
}: AgentVoiceTesterProps) {
  const [text, setText] = useState(`Olá, eu sou ${agentName}, um assistente de voz da Voxemy via Vapi AI. Como posso ajudar você hoje?`);
  const { isLoading, makeCall } = useVoiceCall();
  
  const handleMakeCall = async () => {
    if (!agentId) {
      toast.error("ID do agente não disponível");
      return;
    }

    const phoneNumber = prompt("Digite o número de telefone para ligar (apenas números com DDD):");
    
    if (!phoneNumber) {
      toast.error("Número de telefone não fornecido");
      return;
    }
    
    // Validar formato do telefone
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Número de telefone inválido. Use apenas números, incluindo DDD (ex: 11999887766)");
      return;
    }
    
    try {
      toast.info(`Iniciando chamada Vapi AI para ${phoneNumber}...`);
      
      console.log("Iniciando chamada Vapi com assistantId:", assistantId);
      console.log("Mensagem a ser enviada:", text);
      console.log("Número de telefone:", phoneNumber);
      
      const result = await makeCall({
        agentId,
        campaignId: "",
        phoneNumber,
        message: text,
        leadId: "",
        assistantId
      });
      
      if (result && result.success) {
        toast.success(`Chamada Vapi AI iniciada com sucesso! ID: ${result.callId}`);
      } else {
        toast.error("Erro ao iniciar chamada: Nenhuma resposta recebida");
      }
    } catch (err: any) {
      console.error("Erro ao iniciar chamada:", err);
      toast.error(`Erro ao iniciar chamada: ${err.message || "Falha inesperada"}`);
    }
  };
  
  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Testar chamada: {agentName}</h3>
        <p className="text-sm text-muted-foreground">
          Configure a mensagem e teste uma chamada via Vapi AI
        </p>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Digite o texto para o agente falar..."
        className="min-h-[100px]"
      />

      <div className="flex flex-col space-y-3">
        <Button 
          onClick={handleMakeCall}
          disabled={isLoading || !text}
          className="flex items-center gap-2"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
          <span>Fazer ligação teste (Vapi AI)</span>
        </Button>
      </div>

      {onClose && (
        <Button 
          onClick={onClose}
          variant="ghost"
          className="w-full"
        >
          Fechar
        </Button>
      )}
      
      <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
        <p>O sistema Voxemy agora usa Vapi AI com:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>Voz natural ElevenLabs em português brasileiro</li>
          <li>Transcrição precisa via OpenAI</li>
          <li>Conversas mais fluidas e naturais</li>
          <li>Integração simplificada sem WebSockets</li>
        </ul>
      </div>
    </Card>
  );
}
