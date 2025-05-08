
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { toast } from "@/components/ui/sonner";

interface AudioPlayerProps {
  audioData?: string;
  isLoading?: boolean;
}

export function AudioPlayer({ audioData, isLoading = false }: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Clean up audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // When audioData changes, reset errors
  useEffect(() => {
    if (audioData) {
      setAudioError(null);
    }
  }, [audioData]);

  const playAudio = () => {
    try {
      if (!audioData) {
        toast.error("Nenhum áudio disponível para reproduzir");
        return;
      }

      console.log("Iniciando reprodução de áudio...");
      console.log("Tamanho dos dados de áudio:", audioData.length);

      // Se já existe um elemento de áudio, pare-o
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Criar um novo elemento para evitar problemas de cache
      const audio = new Audio();
      
      // Definir manipuladores de eventos primeiro para debug
      audio.onloadeddata = () => {
        console.log("Dados de áudio carregados com sucesso");
      };
      
      audio.onplay = () => {
        console.log("Reprodução iniciada");
        setIsPlaying(true);
      };
      
      audio.onended = () => {
        console.log("Reprodução finalizada");
        setIsPlaying(false);
      };
      
      audio.onpause = () => {
        console.log("Reprodução pausada");
        setIsPlaying(false);
      };
      
      audio.onerror = (e) => {
        const errorCode = audio.error ? audio.error.code : "desconhecido";
        const errorMessage = audio.error ? audio.error.message : "Erro desconhecido";
        console.error(`Erro ao reproduzir áudio: Código ${errorCode}, Mensagem: ${errorMessage}`);
        
        setAudioError(`Erro ao reproduzir áudio: ${errorMessage}`);
        setIsPlaying(false);
        toast.error("Erro ao reproduzir áudio. Verifique o console para mais detalhes.");
      };
      
      // É importante configurar o volume antes da fonte
      audio.volume = 1.0;
      
      // Usar um formato de dados compatível com todos os navegadores
      audio.src = `data:audio/mp3;base64,${audioData}`;
      
      // Armazenar referência
      audioRef.current = audio;
      
      // Tentar reproduzir
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Erro ao iniciar reprodução:", error);
          
          // Erros específicos de permissão e interação do usuário
          if (error.name === "NotAllowedError") {
            setAudioError("O navegador bloqueou a reprodução automática de áudio. Clique na página primeiro.");
            toast.error("Reprodução automática bloqueada. Clique em qualquer lugar da página e tente novamente.");
          } else {
            setAudioError(`Falha ao reproduzir áudio: ${error.message}`);
            toast.error("Não foi possível reproduzir o áudio. Tente novamente.");
          }
          
          setIsPlaying(false);
        });
      }
    } catch (err: any) {
      console.error("Erro ao reproduzir áudio:", err);
      setAudioError(`Erro: ${err.message}`);
      toast.error("Erro ao reproduzir áudio");
      setIsPlaying(false);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant={isPlaying ? "destructive" : "default"}
        size="sm"
        disabled={isLoading || !audioData}
        onClick={isPlaying ? stopAudio : playAudio}
        className="flex items-center gap-1.5"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Carregando...</span>
          </>
        ) : (
          <>
            {isPlaying ? (
              <VolumeX className="h-4 w-4" />
            ) : (
              <Volume2 className="h-4 w-4" />
            )}
            <span>{isPlaying ? "Parar" : "Reproduzir"}</span>
          </>
        )}
      </Button>
      
      {audioError && (
        <p className="text-xs text-red-500">{audioError}</p>
      )}
    </div>
  );
}
