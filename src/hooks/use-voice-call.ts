
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MakeCallParams {
  phoneNumber: string;
  message?: string;
  agentId?: string;
  campaignId?: string;
}

interface TextToSpeechParams {
  text: string;
  voiceId?: string;
  model?: string;
}

export function useVoiceCall() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [lastAudioContent, setLastAudioContent] = useState<string | null>(null);

  // Limpar referências quando o componente é desmontado
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Função para converter texto em áudio usando Eleven Labs
  const textToSpeech = async ({ text, voiceId, model }: TextToSpeechParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Enviando texto para conversão:', text);
      console.log('Usando voice ID:', voiceId || 'padrão');
      console.log('Usando model:', model || 'padrão');
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          voiceId,
          model
        }
      });

      if (error) {
        console.error('Erro na função text-to-speech:', error);
        throw new Error(error.message);
      }
      
      if (!data.success) {
        console.error('Falha na resposta text-to-speech:', data.error);
        throw new Error(data.error || 'Falha ao gerar áudio');
      }

      console.log('Áudio recebido com sucesso:', data.metadata ? JSON.stringify(data.metadata) : 'sem metadados');
      
      // Armazenar o conteúdo do áudio para reprodução posterior
      setLastAudioContent(data.audioContent);
      
      return data.audioContent; // Conteúdo do áudio em base64
    } catch (err: any) {
      console.error('Erro na conversão de texto para voz:', err);
      setError(err.message);
      toast.error('Erro ao converter texto para voz: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para reproduzir áudio base64
  const playAudio = (base64Audio: string) => {
    try {
      console.log('Iniciando reprodução de áudio...');
      setIsPlaying(true);
      
      // Se já existir um elemento de áudio, pare-o
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      // Criar novo elemento de áudio
      const audio = new Audio();
      audio.src = `data:audio/mp3;base64,${base64Audio}`;
      
      // Definir volume para garantir que não esteja mudo
      audio.volume = 1.0;
      
      // Configurar eventos para debug
      audio.onloadedmetadata = () => console.log('Áudio carregado:', audio.duration, 'segundos');
      audio.onplay = () => console.log('Reprodução iniciada');
      audio.onended = () => {
        console.log('Reprodução finalizada');
        setIsPlaying(false);
      };
      audio.onpause = () => console.log('Reprodução pausada');
      
      // Configurar evento de erro
      audio.onerror = (e) => {
        console.error('Erro ao reproduzir áudio:', e);
        toast.error('Erro ao reproduzir áudio. Verifique suas configurações de áudio.');
        setIsPlaying(false);
      };
      
      // Armazenar referência
      audioRef.current = audio;
      
      // Reproduzir áudio
      console.log('Tentando reproduzir áudio...');
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('Reprodução iniciada com sucesso');
            // Verificar se há áudio sendo reproduzido após 500ms
            setTimeout(() => {
              if (audio.currentTime > 0) {
                console.log('Áudio está progredindo:', audio.currentTime);
              } else {
                console.log('Áudio não está progredindo');
              }
            }, 500);
          })
          .catch(err => {
            console.error('Erro ao iniciar reprodução:', err);
            setIsPlaying(false);
            toast.error('Não foi possível reproduzir o áudio. Verifique se seu navegador permite reprodução automática de som.');
          });
      }
      
      return true;
    } catch (err) {
      console.error('Falha ao reproduzir áudio:', err);
      setIsPlaying(false);
      toast.error('Erro ao reproduzir áudio');
      return false;
    }
  };

  // Reproduzir o último áudio novamente
  const playLastAudio = () => {
    if (lastAudioContent) {
      return playAudio(lastAudioContent);
    }
    return false;
  };

  // Função para fazer uma chamada usando Twilio
  const makeCall = async ({ phoneNumber, message, agentId, campaignId }: MakeCallParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // URL para receber callbacks de status de chamada
      const callbackUrl = `${window.location.origin}/api/call-status`;

      console.log('Iniciando chamada para:', phoneNumber);
      
      const { data, error } = await supabase.functions.invoke('make-call', {
        body: { 
          phoneNumber,
          callbackUrl,
          agentId,
          campaignId,
          twimlInstructions: message ? `
            <Response>
              <Say language="pt-BR">${message}</Say>
            </Response>
          ` : undefined,
        }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Falha ao iniciar chamada');

      toast.success('Chamada iniciada com sucesso!');
      return data;
    } catch (err: any) {
      console.error('Erro ao fazer chamada:', err);
      setError(err.message);
      toast.error('Erro ao fazer chamada: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    isPlaying,
    error,
    textToSpeech,
    playAudio,
    playLastAudio,
    makeCall
  };
}
