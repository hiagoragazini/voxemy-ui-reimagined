
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

  // Função para converter texto em áudio usando Eleven Labs
  const textToSpeech = async ({ text, voiceId, model }: TextToSpeechParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          voiceId,
          model
        }
      });

      if (error) throw new Error(error.message);
      if (!data.success) throw new Error(data.error || 'Falha ao gerar áudio');

      return data.audioContent; // Conteúdo do áudio em base64
    } catch (err) {
      console.error('Erro na conversão de texto para voz:', err);
      setError(err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para reproduzir áudio base64
  const playAudio = (base64Audio: string) => {
    const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
    return audio.play();
  };

  // Função para fazer uma chamada usando Twilio
  const makeCall = async ({ phoneNumber, message, agentId, campaignId }: MakeCallParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // URL para receber callbacks de status de chamada
      const callbackUrl = `${window.location.origin}/api/call-status`;

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

      return data;
    } catch (err) {
      console.error('Erro ao fazer chamada:', err);
      setError(err.message);
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
