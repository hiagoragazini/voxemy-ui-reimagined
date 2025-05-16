
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface TestCallParams {
  phoneNumber: string;
  testAudioUrl: string;
  description: string;
}

export function useVoiceCall() {
  const [isLoading, setIsLoading] = useState(false);
  const [callDetails, setCallDetails] = useState<any>(null);

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

  return {
    testCallWithSimpleAudio,
    isLoading,
    callDetails
  };
}
