
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useVoiceCall } from "@/hooks/use-voice-call";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { VOICES } from "@/constants/voices";

interface AgentVoiceTesterProps {
  agentName?: string;
  agentId?: string;
  voiceId?: string;
  onClose?: () => void;
}

export function AgentVoiceTester({
  agentName = "Agente",
  agentId,
  voiceId,
  onClose
}: AgentVoiceTesterProps) {
  const [text, setText] = useState(`Olá, eu sou ${agentName}, um assistente de voz. Como posso ajudar você hoje?`);
  const [audioContent, setAudioContent] = useState<string | null>(null);
  const { isLoading, textToSpeech, playAudio } = useVoiceCall();
  
  // Use a voz Laura que tem boa qualidade para português
  const defaultVoiceId = "FGY2WhTYpPnrIDTdsKH5"; // Laura - melhor para português
  
  const handleTestVoice = async () => {
    if (!text.trim()) {
      toast.error("Por favor, insira um texto para testar");
      return;
    }
    
    try {
      // Usar configurações otimizadas para português com modelo fixo
      const audioData = await textToSpeech({ 
        text, 
        voiceId: voiceId || defaultVoiceId,
        model: "eleven_multilingual_v1", // Forçando modelo específico para português
        stability: 0.7,         // Valor mais baixo para mais naturalidade
        similarity_boost: 0.8,  // Equilibrado para manter identidade da voz
        style: 0.4              // Valor menor para reduzir robótica
      });
      
      if (audioData) {
        setAudioContent(audioData);
        playAudio(audioData);
      } else {
        toast.error("Não foi possível gerar áudio");
      }
    } catch (err) {
      console.error("Erro ao testar voz:", err);
      toast.error("Erro ao testar a voz do agente");
    }
  };
  
  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Testar voz: {agentName}</h3>
        <p className="text-sm text-muted-foreground">
          Digite um texto para ouvir como a voz deste agente soa
        </p>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Digite o texto para o agente falar..."
        className="min-h-[100px]"
      />

      <div className="flex flex-col space-y-3">
        {!audioContent && (
          <Button 
            onClick={handleTestVoice}
            disabled={isLoading || !text}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            <span>Testar Voz</span>
          </Button>
        )}
        
        {audioContent && (
          <div className="flex items-center justify-center p-2 bg-slate-50 rounded-md">
            <AudioPlayer 
              audioData={audioContent} 
              isLoading={isLoading} 
            />
          </div>
        )}

        {audioContent && (
          <Button 
            onClick={handleTestVoice}
            disabled={isLoading}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Volume2 className="h-4 w-4" />
            <span>Testar com outro texto</span>
          </Button>
        )}
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
    </Card>
  );
}
