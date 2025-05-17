
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface MakeCallParams {
  agentId: string;
  campaignId?: string;
  phoneNumber: string;
  message: string;
  leadId?: string;
  voiceId?: string;
}

export function useZenviaCall() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callDetails, setCallDetails] = useState<any>(null);

  // Make a call with Zenvia
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

      console.log('Iniciando chamada Zenvia:', {
        agentId,
        campaignId,
        phoneNumber: cleanPhone,
        message,
        leadId,
        voiceId
      });

      // Call the Edge Function to make the Zenvia call
      const { data, error } = await supabase.functions.invoke('zenvia-call-handler', {
        body: {
          agentId,
          campaignId,
          phoneNumber: cleanPhone,
          message,
          leadId,
          voiceId
        }
      });

      if (error) {
        console.error('Erro ao fazer chamada Zenvia:', error);
        setError(error.message);
        toast.error(`Erro na chamada: ${error.message || 'Falha ao conectar'}`);
        return null;
      }

      console.log('Chamada Zenvia iniciada com sucesso:', data);
      toast.success('Chamada iniciada com sucesso!');
      setCallDetails(data);
      return data;

    } catch (err: any) {
      console.error('Erro inesperado ao fazer chamada Zenvia:', err);
      setError(err.message);
      toast.error(`Erro: ${err.message || 'Falha inesperada'}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    makeCall,
    isLoading,
    error,
    callDetails
  };
}
