
"use client";

import { useState, useEffect } from "react";
import { useVoiceCall } from "@/hooks/use-voice-call";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Mic, Phone, Volume2, Loader2, VolumeX, Volume1 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";

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
  const [audioTested, setAudioTested] = useState(false);
  const [volumeLevel, setVolumeLevel] = useState(1);
  const { 
    isLoading, 
    isPlaying,
    error, 
    textToSpeech, 
    playAudio, 
    playLastAudio, 
    makeCall 
  } = useVoiceCall();

  // Verificar se o navegador suporta áudio
  const [browserSupportsAudio, setBrowserSupportsAudio] = useState(true);
  
  useEffect(() => {
    try {
      const audio = new Audio();
      if (!audio.canPlayType) {
        setBrowserSupportsAudio(false);
      }
    } catch (e) {
      console.error("Erro ao verificar suporte a áudio:", e);
      setBrowserSupportsAudio(false);
    }
  }, []);

  // Função para testar se o sistema de áudio está funcionando
  const testSystemAudio = () => {
    try {
      const testAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
      testAudio.volume = volumeLevel;
      
      const playPromise = testAudio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Sistema de áudio funcionando");
            toast.success("Seu sistema de áudio está funcionando corretamente");
          })
          .catch(err => {
            console.error("Erro no sistema de áudio:", err);
            toast.error("Não foi possível reproduzir áudio. Verifique suas configurações de som e permissões do navegador.");
          });
      }
    } catch (err) {
      console.error("Erro ao testar áudio:", err);
      toast.error("Seu navegador pode não suportar reprodução de áudio");
    }
  };

  const handleTestVoice = async () => {
    if (!text.trim()) {
      toast.error("Por favor, insira um texto para testar");
      return;
    }
    
    const audio = await textToSpeech({ text, voiceId });
    
    if (audio) {
      setAudioTested(true);
      const played = playAudio(audio);
      
      if (!played) {
        toast.error("Não foi possível reproduzir o áudio. Verifique suas configurações de som.");
      }
    } else {
      toast.error("Falha ao gerar áudio. Verifique os logs para mais detalhes.");
    }
  };

  const handlePlayAgain = () => {
    const played = playLastAudio();
    
    if (!played) {
      toast.error("Não foi possível reproduzir o áudio. Verifique suas configurações de som.");
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

  const handleVolumeChange = (level: number) => {
    setVolumeLevel(level);
    toast.info(`Volume definido para ${level * 100}%`);
  };

  // Renderizar mensagem de debug se houver erro
  const renderDebugInfo = () => {
    if (error) {
      return (
        <Alert variant="destructive" className="mt-2">
          <AlertTitle>Erro detectado</AlertTitle>
          <AlertDescription>
            {error}
            <div className="mt-2 text-xs">
              <p><strong>Dicas de solução:</strong></p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Certifique-se de que a API do Eleven Labs está configurada corretamente</li>
                <li>Verifique se seu navegador permite reprodução de áudio</li>
                <li>Tente em outro navegador (Chrome geralmente tem melhor compatibilidade)</li>
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    return null;
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

      {!browserSupportsAudio && (
        <Alert variant="warning" className="mb-2">
          <AlertTitle>Aviso</AlertTitle>
          <AlertDescription>
            Seu navegador pode não suportar completamente a reprodução de áudio.
            Tente usar um navegador mais recente como Chrome ou Firefox.
          </AlertDescription>
        </Alert>
      )}

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Digite o texto para o agente falar..."
        className="min-h-[100px]"
      />

      {renderDebugInfo()}

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
            <span>{audioTested ? "Testar Novamente" : "Testar Voz"}</span>
          </Button>
          
          {audioTested && (
            <Button
              onClick={handlePlayAgain}
              variant="outline"
              className="flex items-center gap-2"
              disabled={isLoading || isPlaying}
            >
              <Volume2 className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="flex gap-2 items-center mb-2">
          <Button 
            size="sm" 
            variant={volumeLevel === 0.2 ? "default" : "outline"}
            onClick={() => handleVolumeChange(0.2)}
            className="flex-1"
          >
            <VolumeX className="h-4 w-4 mr-1" /> Baixo
          </Button>
          <Button 
            size="sm" 
            variant={volumeLevel === 0.6 ? "default" : "outline"}
            onClick={() => handleVolumeChange(0.6)}
            className="flex-1"
          >
            <Volume1 className="h-4 w-4 mr-1" /> Médio
          </Button>
          <Button 
            size="sm" 
            variant={volumeLevel === 1 ? "default" : "outline"}
            onClick={() => handleVolumeChange(1)}
            className="flex-1"
          >
            <Volume2 className="h-4 w-4 mr-1" /> Alto
          </Button>
        </div>

        <Button
          onClick={testSystemAudio}
          variant="outline"
          className="flex items-center gap-2"
          size="sm"
        >
          <Volume2 className="h-4 w-4" />
          <span>Testar Sistema de Áudio</span>
        </Button>

        <div className="relative mt-2">
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

      <div className="space-y-2 text-center text-xs text-muted-foreground mt-2">
        <p className="font-medium">Não está ouvindo o áudio?</p>
        <ul className="text-left pl-4 space-y-1">
          <li>✓ Verifique se o volume do seu dispositivo está ligado</li>
          <li>✓ Certifique-se de que seu navegador permite reprodução automática de áudio</li>
          <li>✓ Tente usar os botões de volume acima para ajustar o volume</li>
          <li>✓ Tente usar outro navegador (Chrome geralmente funciona melhor)</li>
          <li>✓ Verifique se há bloqueadores de áudio ativos</li>
        </ul>
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
