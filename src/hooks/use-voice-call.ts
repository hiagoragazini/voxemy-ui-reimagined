
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MakeCallParams {
  agentId: string;
  campaignId?: string;
  phoneNumber: string;
  message: string;
  leadId?: string;
  assistantId?: string;
}

export function useVoiceCall() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callDetails, setCallDetails] = useState<any>(null);

  // Make a call with Vapi AI
  const makeCall = async ({ 
    agentId, 
    campaignId, 
    phoneNumber, 
    message, 
    leadId,
    assistantId 
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

      console.log('Iniciando chamada Vapi:', {
        agentId,
        campaignId,
        phoneNumber: cleanPhone,
        message,
        leadId,
        assistantId
      });

      // Call the new Vapi edge function
      const { data, error } = await supabase.functions.invoke('make-vapi-call', {
        body: {
          agentId,
          campaignId,
          phoneNumber: cleanPhone,
          message,
          leadId,
          assistantId
        }
      });

      if (error) {
        console.error('Erro ao fazer chamada Vapi:', error);
        setError(error.message);
        toast.error(`Erro na chamada: ${error.message || 'Falha ao conectar'}`);
        return null;
      }

      console.log('Chamada Vapi iniciada com sucesso:', data);
      toast.success('Chamada iniciada com sucesso via Vapi AI!');
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

  // Legacy functions for backward compatibility (now simplified)
  const textToSpeech = async ({ text }: { text: string }) => {
    console.log('textToSpeech não é mais necessário com Vapi AI');
    return null;
  };

  const playAudio = (audioData: string) => {
    console.log('playAudio não é mais necessário com Vapi AI');
    return false;
  };

  const stopAudio = () => {
    console.log('stopAudio não é mais necessário com Vapi AI');
    return false;
  };

  const testCallWithSimpleAudio = async () => {
    console.log('testCallWithSimpleAudio substituído por chamadas Vapi diretas');
    return null;
  };

  return {
    makeCall,
    textToSpeech,
    playAudio,
    stopAudio,
    testCallWithSimpleAudio,
    playLastAudio: () => false,
    isLoading,
    isPlaying: false,
    error,
    callDetails,
    audioContent: null
  };
}
