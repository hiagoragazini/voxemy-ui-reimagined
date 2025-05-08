
"use client";

import { useState } from "react";
import { useVoiceCall } from "@/hooks/use-voice-call";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Mic, Phone } from "lucide-react";

interface VoiceTesterProps {
  agentName?: string;
  agentId?: string;
  voiceId?: string;
  defaultText?: string;
  testNumber?: string;
  onClose?: () => void;
}

export function VoiceTester({
  agentName,
  agentId,
  voiceId = "pFZP5JQG7iQjIQuC4Bku", // Lily (voz feminina padrão)
  defaultText = "Olá, eu sou um agente de voz alimentado por inteligência artificial. Como posso ajudar você hoje?",
  testNumber,
  onClose
}: VoiceTesterProps) {
  const [text, setText] = useState(defaultText);
  const [phoneNumber, setPhoneNumber] = useState(testNumber || "");
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const { isLoading, error, textToSpeech, playAudio, makeCall } = useVoiceCall();

  const handleTestVoice = async () => {
    const audio = await textToSpeech({ text, voiceId });
    if (audio) {
      setAudioBase64(audio);
      playAudio(audio);
    }
  };

  const handleMakeCall = async () => {
    if (!phoneNumber) {
      alert("Por favor, informe um número de telefone para teste");
      return;
    }
    
    await makeCall({
      phoneNumber,
      message: text,
      agentId
    });
  };

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg shadow">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">
          {agentName ? `Testar voz: ${agentName}` : "Testar voz do agente"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Experimente a voz do agente ou faça uma chamada de teste
        </p>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Digite o texto para o agente falar..."
        className="min-h-[100px]"
      />

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="flex flex-col space-y-3">
        <Button 
          onClick={handleTestVoice}
          disabled={isLoading || !text}
          className="w-full flex items-center gap-2 bg-violet-600 hover:bg-violet-700"
        >
          <Play className="h-4 w-4" />
          <span>Testar Voz</span>
        </Button>

        <div className="relative">
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Digite um número para teste (ex: 11987654321)"
            className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-violet-500"
          />
          
          <Button 
            onClick={handleMakeCall}
            disabled={isLoading || !text || !phoneNumber}
            className="mt-2 w-full flex items-center gap-2"
            variant="outline"
          >
            <Phone className="h-4 w-4" />
            <span>Fazer Chamada de Teste</span>
          </Button>
        </div>
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
    </div>
  );
}
