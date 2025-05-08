
"use client";

import { useState } from "react";
import { useVoiceCall } from "@/hooks/use-voice-call";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Mic, Phone, Volume2, Loader2 } from "lucide-react";
import { toast } from "sonner";

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
  const [isPlaying, setIsPlaying] = useState(false);

  const handleTestVoice = async () => {
    if (!text.trim()) {
      toast.error("Por favor, insira um texto para testar");
      return;
    }
    
    setIsPlaying(true);
    const audio = await textToSpeech({ text, voiceId });
    
    if (audio) {
      setAudioBase64(audio);
      const played = playAudio(audio);
      
      if (!played) {
        toast.error("Não foi possível reproduzir o áudio. Verifique suas configurações de som.");
      }
    } else {
      toast.error("Falha ao gerar áudio. Verifique os logs para mais detalhes.");
    }
    setIsPlaying(false);
  };

  const handlePlayAgain = () => {
    if (audioBase64) {
      setIsPlaying(true);
      const played = playAudio(audioBase64);
      setIsPlaying(false);
      
      if (!played) {
        toast.error("Não foi possível reproduzir o áudio. Verifique suas configurações de som.");
      }
    }
  };

  const handleMakeCall = async () => {
    if (!phoneNumber) {
      toast.error("Por favor, informe um número de telefone para teste");
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
        <div className="flex gap-2">
          <Button 
            onClick={handleTestVoice}
            disabled={isLoading || !text}
            className="w-full flex items-center gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            <span>Testar Voz</span>
          </Button>
          
          {audioBase64 && (
            <Button
              onClick={handlePlayAgain}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          )}
        </div>

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
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Phone className="h-4 w-4" />
            )}
            <span>Fazer Chamada de Teste</span>
          </Button>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground mt-2">
        <p>
          Se não estiver ouvindo som, verifique se o volume do seu dispositivo está ativado 
          e se o seu navegador permite a reprodução automática de áudio.
        </p>
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
