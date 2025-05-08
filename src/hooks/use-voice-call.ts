
import { useState } from 'react';
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
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Função para converter texto em áudio usando Eleven Labs
  const textToSpeech = async ({ text, voiceId, model }: TextToSpeechParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Enviando texto para conversão:', text);
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          voiceId,
          model
        }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Falha ao gerar áudio');

      console.log('Áudio recebido com sucesso');
      return data.audioContent; // Conteúdo do áudio em base64
    } catch (err) {
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
      console.log('Reproduzindo áudio...');
      
      // Se já existir um elemento de áudio, pare-o
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      
      // Criar um novo elemento de áudio
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      
      // Configurar eventos de áudio para debug
      audio.addEventListener('play', () => console.log('Áudio iniciou a reprodução'));
      audio.addEventListener('ended', () => console.log('Áudio terminou de reproduzir'));
      audio.addEventListener('error', (e) => console.error('Erro ao reproduzir áudio:', e));
      
      // Definir volume para garantir que não esteja mudo
      audio.volume = 1.0;
      
      // Armazenar referência ao elemento de áudio
      setAudioElement(audio);
      
      // Tocar áudio
      const playPromise = audio.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => console.log('Reprodução de áudio iniciada com sucesso'))
          .catch(err => {
            console.error('Erro ao iniciar reprodução de áudio:', err);
            toast.error('Não foi possível reproduzir o áudio. Verifique se seu navegador permite reprodução automática de som.');
          });
      }
      
      return true;
    } catch (err) {
      console.error('Falha ao reproduzir áudio:', err);
      toast.error('Erro ao reproduzir áudio');
      return false;
    }
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
    } catch (err) {
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
    error,
    textToSpeech,
    playAudio,
    makeCall
  };
}
