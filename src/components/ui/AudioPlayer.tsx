
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface AudioPlayerProps {
  audioData?: string;
  url?: string;
  isLoading?: boolean;
}

export function AudioPlayer({ audioData, url, isLoading = false }: AudioPlayerProps) {
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
    if (audioData || url) {
      setAudioError(null);
    }
  }, [audioData, url]);

  const playAudio = () => {
    try {
      if (!audioData && !url) {
        toast.error("Nenhum áudio disponível para reproduzir");
        return;
      }

      console.log("Iniciando reprodução de áudio...");
      console.log("Fonte de áudio:", url ? "URL" : "Dados base64");

      // Se já existe um elemento de áudio, pare-o
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }

      // Create an audio element safely
      const audio = new Audio();
      
      // Set event handlers first for debugging
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
      
      // Important: Set volume before source
      audio.volume = 1.0;
      
      // Set the audio source based on what's provided
      if (url) {
        audio.src = url;
      } else if (audioData && audioData.length > 0) {
        audio.src = `data:audio/mp3;base64,${audioData}`;
      } else {
        setAudioError("Dados de áudio inválidos ou vazios");
        toast.error("Erro: Dados de áudio inválidos");
        return;
      }
      
      // Store reference
      audioRef.current = audio;
      
      // Try to play
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Erro ao iniciar reprodução:", error);
          
          // Specific errors for permission and user interaction
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
        disabled={isLoading || (!audioData && !url)}
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
