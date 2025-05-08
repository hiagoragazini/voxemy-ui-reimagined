
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Volume2 } from "lucide-react";
import { toast } from "sonner";
import { useVoiceCallSimple } from "@/hooks/use-voice-call-simple";
import { AudioPlayer } from "@/components/ui/AudioPlayer";

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
  const { isLoading, audioContent, textToSpeech } = useVoiceCallSimple();
  
  const handleTestVoice = async () => {
    if (!text.trim()) {
      toast.error("Por favor, insira um texto para testar");
      return;
    }
    
    try {
      await textToSpeech({ 
        text, 
        voiceId,
        model: "eleven_multilingual_v2",
        stability: 0.75,
        similarity_boost: 0.85,
        style: 0.6,
        use_speaker_boost: true
      });
    } catch (err) {
      // Error already handled in the hook
      console.error("Erro ao testar voz:", err);
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
