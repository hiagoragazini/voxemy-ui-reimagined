
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
    voiceId = "FGY2WhTYpPnrIDTdsKH5", // Laura - melhor para português
    model = "eleven_multilingual_v1", // Forçando modelo específico para português
    stability = 0.7,          // Valor mais baixo para mais naturalidade
    similarity_boost = 0.8,   // Equilibrado para manter identidade da voz
    style = 0.4,              // Valor menor para reduzir robótica
    use_speaker_boost = true  // Ativar melhoria de alto-falante
  }: TextToSpeechParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Log detalhado para diagnóstico
      console.log('[useVoiceCallSimple] Enviando texto para conversão:', text);
      console.log('[useVoiceCallSimple] Usando voice ID:', voiceId);
      console.log('[useVoiceCallSimple] Usando model:', model);
      console.log('[useVoiceCallSimple] Configurações de voz:', { stability, similarity_boost, style, use_speaker_boost });
      
      const { data, error } = await supabase.functions.invoke('text-to-speech', {
        body: { 
          text, 
          voiceId,
          model, // Usando modelo específico para português
          voice_settings: {
            stability,
            similarity_boost,
            style,
            use_speaker_boost
          }
        }
      });

      if (error) {
        console.error('[useVoiceCallSimple] Erro na função text-to-speech:', error);
        throw new Error(error.message);
      }
      
      if (!data.success) {
        console.error('[useVoiceCallSimple] Falha na resposta text-to-speech:', data.error);
        throw new Error(data.error || 'Falha ao gerar áudio');
      }

      console.log('[useVoiceCallSimple] Áudio recebido com sucesso:', data.metadata);
      
      // Armazenar o conteúdo do áudio para reprodução
      setAudioContent(data.audioContent);
      
      return data.audioContent;
    } catch (err: any) {
      console.error('[useVoiceCallSimple] Erro na conversão de texto para voz:', err);
      setError(err.message);
      toast.error('Erro ao converter texto para voz: ' + err.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Função para reproduzir áudio
  const playAudio = (base64Audio: string) => {
    if (!base64Audio) return false;
    
    try {
      // Criar elemento de áudio
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      
      // Configurar volume alto
      audio.volume = 1.0;
      
      // Reproduzir
      audio.play().catch(err => {
        console.error('[useVoiceCallSimple] Erro ao reproduzir áudio:', err);
        toast.error('Erro ao reproduzir áudio');
        return false;
      });
      
      return true;
    } catch (err) {
      console.error('[useVoiceCallSimple] Erro ao criar elemento de áudio:', err);
      toast.error('Erro ao reproduzir áudio');
      return false;
    }
  };

  return {
    isLoading,
    error,
    audioContent,
    textToSpeech,
    playAudio
  };
}
