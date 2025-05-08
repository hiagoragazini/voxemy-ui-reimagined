
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TextToSpeechParams {
  text: string;
  voiceId?: string;
  model?: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

export function useVoiceCallSimple() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audioContent, setAudioContent] = useState<string | null>(null);

  // Função para converter texto em áudio usando Eleven Labs com qualidade aprimorada
  const textToSpeech = async ({ 
    text, 
    voiceId, 
    model, 
    stability = 0.8, 
    similarity_boost = 0.9, 
    style = 0.5,
    use_speaker_boost = true
  }: TextToSpeechParams) => {
    setIsLoading(true);
    setError(null);
    setAudioContent(null);
    
    try {
      console.log('Enviando texto para conversão:', text);
      console.log('Usando voice ID:', voiceId || 'padrão');
      console.log('Usando model:', model || 'padrão');
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          voiceId,
          model,
          voice_settings: {
            stability,
            similarity_boost,
            style,
            use_speaker_boost
          }
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

      console.log('Áudio recebido com sucesso:', data.metadata);
      
      // Armazenar o conteúdo do áudio para reprodução
      setAudioContent(data.audioContent);
      
      return data.audioContent;
    } catch (err: any) {
      console.error('Erro na conversão de texto para voz:', err);
      setError(err.message);
      toast.error('Erro ao converter texto para voz: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    error,
    audioContent,
    textToSpeech
  };
}
