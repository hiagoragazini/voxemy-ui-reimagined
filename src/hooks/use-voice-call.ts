
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestCallParams {
  phoneNumber: string;
  testAudioUrl: string;
  description: string;
}

interface TextToSpeechParams {
  text: string;
  voiceId?: string;
  model?: string;
  stability?: number;
  similarity_boost?: number;
  style?: number;
  use_speaker_boost?: boolean;
}

interface MakeCallParams {
  agentId: string;
  campaignId?: string;
  phoneNumber: string;
  message: string;
  leadId?: string;
  voiceId?: string;
}

export function useVoiceCall() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callDetails, setCallDetails] = useState<any>(null);
  const [audioContent, setAudioContent] = useState<string | null>(null);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Test call with simple MP3 audio
  const testCallWithSimpleAudio = async ({ phoneNumber, testAudioUrl, description }: TestCallParams) => {
    try {
      setIsLoading(true);
      
      // Clean the phone number by removing any non-digit characters
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      // Check if the phone number is valid (has 10-15 digits)
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        toast.error('Número de telefone inválido');
        return null;
      }

      // Check if the audio URL is valid
      if (!testAudioUrl || !testAudioUrl.startsWith('http')) {
        toast.error('URL de áudio inválida');
        return null;
      }

      console.log('Iniciando chamada de teste com áudio simples:', {
        phoneNumber: cleanPhone,
        audioUrl: testAudioUrl
      });

      // Call the Edge Function to make the test call
      const { data, error } = await supabase.functions.invoke('test-audio-call', {
        body: {
          phoneNumber: cleanPhone,
          audioUrl: testAudioUrl,
          description: description || 'Teste com áudio MP3 simples'
        }
      });

      if (error) {
        console.error('Erro ao fazer chamada de teste:', error);
        toast.error(`Erro na chamada: ${error.message || 'Falha ao conectar'}`);
        return null;
      }

      console.log('Chamada de teste iniciada com sucesso:', data);
      toast.success('Chamada de teste iniciada com sucesso!');
      setCallDetails(data);
      return data;

    } catch (err: any) {
      console.error('Erro inesperado ao fazer chamada:', err);
      toast.error(`Erro: ${err.message || 'Falha inesperada'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Text to Speech conversion
  const textToSpeech = async ({ 
    text, 
    voiceId = "FGY2WhTYpPnrIDTdsKH5", // Laura - melhor para português
    model = "eleven_multilingual_v1", 
    stability = 0.7,
    similarity_boost = 0.8,
    style = 0.4,
    use_speaker_boost = true
  }: TextToSpeechParams) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Log for debugging
      console.log('Enviando texto para conversão:', text);
      console.log('Usando voice ID:', voiceId);
      
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
        setError(error.message);
        throw new Error(error.message);
      }
      
      if (!data.success) {
        console.error('Falha na resposta text-to-speech:', data.error);
        setError(data.error || 'Falha ao gerar áudio');
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

  // Make a call with TTS audio
  const makeCall = async ({ 
    agentId, 
    campaignId, 
    phoneNumber, 
    message, 
    leadId,
    voiceId 
  }: MakeCallParams) => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Clean the phone number
      const cleanPhone = phoneNumber.replace(/\D/g, '');
      
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        toast.error('Número de telefone inválido');
        return null;
      }

      if (!message.trim()) {
        toast.error('Mensagem não pode estar vazia');
        return null;
      }

      console.log('Iniciando chamada com TTS:', {
        agentId,
        campaignId,
        phoneNumber: cleanPhone,
        message,
        leadId,
        voiceId
      });

      // Call the Edge Function to make the TTS call
      const { data, error } = await supabase.functions.invoke('tts-twillio-handler', {
        body: {
          agentId,
          campaignId,
          phoneNumber: cleanPhone,
          message, // Enviando como 'message' para compatibilidade com o código atual
          leadId,
          voiceId
        }
      });

      if (error) {
        console.error('Erro ao fazer chamada:', error);
        setError(error.message);
        toast.error(`Erro na chamada: ${error.message || 'Falha ao conectar'}`);
        return null;
      }

      console.log('Chamada iniciada com sucesso:', data);
      toast.success('Chamada iniciada com sucesso!');
      setCallDetails(data);
      return data;

    } catch (err: any) {
      console.error('Erro inesperado ao fazer chamada:', err);
      setError(err.message);
      toast.error(`Erro: ${err.message || 'Falha inesperada'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  // Play audio from base64 string
  const playAudio = (base64Audio: string) => {
    if (!base64Audio) return false;
    
    try {
      // Stop any currently playing audio
      if (audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
      }
      
      // Create new audio element
      const audio = new Audio(`data:audio/mp3;base64,${base64Audio}`);
      audio.volume = 1.0;
      
      // Store the audio element for potential stopping later
      setAudioElement(audio);
      setIsPlaying(true);
      
      // Play
      audio.play().catch(err => {
        console.error('Erro ao reproduzir áudio:', err);
        setIsPlaying(false);
        toast.error('Erro ao reproduzir áudio');
        return false;
      });
      
      // Setup onended event
      audio.onended = () => {
        setIsPlaying(false);
      };
      
      return true;
    } catch (err) {
      console.error('Erro ao criar elemento de áudio:', err);
      setIsPlaying(false);
      toast.error('Erro ao reproduzir áudio');
      return false;
    }
  };

  // Play the last generated audio
  const playLastAudio = () => {
    if (audioContent) {
      return playAudio(audioContent);
    }
    toast.error('Nenhum áudio disponível para reproduzir');
    return false;
  };

  // Stop any currently playing audio
  const stopAudio = () => {
    if (audioElement) {
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsPlaying(false);
      return true;
    }
    return false;
  };

  return {
    testCallWithSimpleAudio,
    textToSpeech,
    makeCall,
    playAudio,
    playLastAudio,
    stopAudio,
    isLoading,
    isPlaying,
    error,
    callDetails,
    audioContent
  };
}
