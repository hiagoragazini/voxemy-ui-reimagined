
"use client";

import { useState, useEffect } from "react";
import { useVoiceCall } from "@/hooks/use-voice-call";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Play, Mic, Phone, Volume2, Loader2, VolumeX, Volume1, HelpCircle } from "lucide-react";
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
  const [audioTestSuccess, setAudioTestSuccess] = useState<boolean | null>(null);
  const [volumeLevel, setVolumeLevel] = useState(1);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  
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
      } else {
        // Verificar suporte a formatos comuns
        const formats = {
          mp3: audio.canPlayType('audio/mpeg'),
          wav: audio.canPlayType('audio/wav'),
          ogg: audio.canPlayType('audio/ogg')
        };
        console.log("Formatos de áudio suportados:", formats);
        
        // Verificar se pelo menos um formato é suportado
        const hasSupport = Object.values(formats).some(support => 
          support === "maybe" || support === "probably"
        );
        
        setBrowserSupportsAudio(hasSupport);
      }
    } catch (e) {
      console.error("Erro ao verificar suporte a áudio:", e);
      setBrowserSupportsAudio(false);
    }
    
    // Tentar detectar problemas comuns de reprodução de áudio
    const checkAudioPermission = async () => {
      try {
        // Verificar se o contexto de áudio pode ser criado
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
        if (!AudioContext) {
          console.error("AudioContext não suportado neste navegador");
          return;
        }
        
        const audioContext = new AudioContext();
        console.log("Estado do contexto de áudio:", audioContext.state);
        
        // Se o contexto está suspenso, pode precisar de interação do usuário
        if (audioContext.state === "suspended") {
          toast.info("Por favor, interaja com a página (clique em qualquer lugar) para permitir a reprodução de áudio");
        }
      } catch (e) {
        console.error("Erro ao verificar permissões de áudio:", e);
      }
    };
    
    checkAudioPermission();
  }, []);

  // Função para gerar um tom de teste simples
  const generateTestTone = (): string => {
    try {
      // Criar um contexto de áudio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const sampleRate = audioContext.sampleRate;
      const duration = 1; // 1 segundo
      
      // Criar um buffer para o tom
      const buffer = audioContext.createBuffer(1, sampleRate * duration, sampleRate);
      const data = buffer.getChannelData(0);
      
      // Gerar um tom de 440Hz (Lá)
      for (let i = 0; i < buffer.length; i++) {
        data[i] = Math.sin(440 * 2 * Math.PI * i / sampleRate);
      }
      
      // Converter para WAV
      const numOfChan = buffer.numberOfChannels;
      const length = buffer.length * numOfChan * 2;
      const buffer2 = new ArrayBuffer(44 + length);
      const view = new DataView(buffer2);
      
      // WAV header
      writeString(view, 0, 'RIFF');
      view.setUint32(4, 36 + length, true);
      writeString(view, 8, 'WAVE');
      writeString(view, 12, 'fmt ');
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, numOfChan, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2 * numOfChan, true);
      view.setUint16(32, numOfChan * 2, true);
      view.setUint16(34, 16, true);
      writeString(view, 36, 'data');
      view.setUint32(40, length, true);
      
      // Escrever dados de áudio
      const volume = 0.5;
      let offset = 44;
      for (let i = 0; i < buffer.length; i++) {
        for (let j = 0; j < numOfChan; j++) {
          const sample = Math.max(-1, Math.min(1, buffer.getChannelData(j)[i]));
          view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
          offset += 2;
        }
      }
      
      // Converter para base64
      const blob = new Blob([buffer2], { type: 'audio/wav' });
      const reader = new FileReader();
      return new Promise<string>((resolve) => {
        reader.onloadend = () => {
          const base64data = (reader.result as string).split(',')[1];
          resolve(base64data);
        };
        reader.readAsDataURL(blob);
      });
      
      function writeString(view: DataView, offset: number, string: string) {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      }
    } catch (e) {
      console.error("Erro ao gerar tom de teste:", e);
      return Promise.resolve("");
    }
  };

  // Função para testar se o sistema de áudio está funcionando
  const testSystemAudio = async () => {
    try {
      // Primeiro, tentar com um tom base64 gerado
      toast.loading("Testando sistema de áudio...");

      try {
        // Gerar um tom de teste
        const testToneBase64 = await generateTestTone();
        
        if (testToneBase64) {
          // Criar elemento de áudio para o tom
          const testAudio = new Audio(`data:audio/wav;base64,${testToneBase64}`);
          testAudio.volume = volumeLevel;
          
          // Adicionar event listeners
          testAudio.onplay = () => console.log("Tom de teste está tocando");
          testAudio.onended = () => {
            console.log("Tom de teste finalizado com sucesso");
            toast.success("Seu sistema de áudio está funcionando corretamente");
            setAudioTestSuccess(true);
          };
          testAudio.onerror = (err) => {
            console.error("Erro ao reproduzir tom de teste:", err);
            fallbackAudioTest();
          };
          
          // Tentar reproduzir
          const playPromise = testAudio.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => console.log("Reprodução do tom de teste iniciada"))
              .catch(err => {
                console.error("Erro ao iniciar tom de teste:", err);
                fallbackAudioTest();
              });
          }
        } else {
          fallbackAudioTest();
        }
      } catch (err) {
        console.error("Erro na geração do tom de teste:", err);
        fallbackAudioTest();
      }
      
      // Método alternativo de teste
      function fallbackAudioTest() {
        console.log("Usando método alternativo para testar áudio...");
        
        // Usar um pequeno arquivo de áudio embutido
        const testAudio = new Audio("data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA");
        testAudio.volume = volumeLevel;
        
        const playPromise = testAudio.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log("Sistema de áudio funcionando (método alternativo)");
              toast.success("Seu sistema de áudio está funcionando corretamente");
              setAudioTestSuccess(true);
            })
            .catch(err => {
              console.error("Erro no sistema de áudio:", err);
              toast.error("Não foi possível reproduzir áudio. Verifique suas configurações de som e permissões do navegador.");
              setAudioTestSuccess(false);
              
              // Sugerir soluções baseadas no erro
              if (err.name === "NotAllowedError") {
                toast.error("Seu navegador bloqueou a reprodução automática de áudio. Tente clicar em algum lugar da página primeiro.");
              } else if (err.name === "AbortError") {
                toast.error("Reprodução de áudio interrompida. Tente novamente.");
              }
            });
        }
      }
    } catch (err) {
      console.error("Erro ao testar áudio:", err);
      toast.error("Seu navegador pode não suportar reprodução de áudio");
      setAudioTestSuccess(false);
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
        // Testar sistema de áudio automaticamente após falha
        testSystemAudio();
      }
    } else {
      toast.error("Falha ao gerar áudio. Verifique os logs para mais detalhes.");
    }
  };

  const handlePlayAgain = () => {
    const played = playLastAudio();
    
    if (!played) {
      toast.error("Não foi possível reproduzir o áudio. Verifique suas configurações de som.");
      // Testar sistema de áudio automaticamente após falha
      testSystemAudio();
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

      {audioTestSuccess === false && (
        <Alert variant="destructive" className="mb-2">
          <AlertTitle>Problema de áudio detectado</AlertTitle>
          <AlertDescription>
            Seu navegador bloqueou ou não conseguiu reproduzir áudio. Verifique se o som do dispositivo está ligado
            e se o navegador permite reprodução automática de áudio.
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

      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          className="flex items-center gap-1 text-xs"
        >
          <HelpCircle className="h-3 w-3" />
          {showTroubleshooting ? "Ocultar dicas" : "Não está ouvindo o áudio?"}
        </Button>
        
        {audioTestSuccess === true && (
          <span className="text-xs text-green-600 font-medium">
            ✓ Sistema de áudio funcionando
          </span>
        )}
      </div>

      {showTroubleshooting && (
        <div className="space-y-2 text-xs text-muted-foreground mt-2 p-3 bg-gray-50 rounded-md">
          <p className="font-medium text-black">Solução de problemas de áudio:</p>
          <ul className="text-left pl-4 space-y-1.5">
            <li className="flex items-start gap-1.5">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Verifique se o volume do seu dispositivo está ligado</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Certifique-se de que seu navegador permite reprodução automática de áudio</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Se usar Chrome, clique no ícone de cadeado na barra de endereço e verifique as permissões de som</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Tente usar os botões de volume acima para ajustar o volume</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Tente usar outro navegador (Chrome geralmente funciona melhor)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Verifique se há bloqueadores de áudio ativos (extensões ou configurações)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Reinicie o navegador e tente novamente</span>
            </li>
          </ul>
          
          <p className="font-medium text-black mt-3">Se nada funcionar:</p>
          <ul className="text-left pl-4 space-y-1.5">
            <li className="flex items-start gap-1.5">
              <span className="text-amber-600 mt-0.5">!</span>
              <span>Use a chamada de telefone para testar a voz do agente</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-amber-600 mt-0.5">!</span>
              <span>Contate o suporte técnico se o problema persistir</span>
            </li>
          </ul>
        </div>
      )}

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
