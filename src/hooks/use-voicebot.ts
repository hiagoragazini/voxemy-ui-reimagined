
import { useState, useRef, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Configuration for our voicebot
export interface VoicebotConfig {
  mediaServerUrl?: string;
  asr?: {
    provider: 'google' | 'deepgram' | 'whisper';
    language?: string;
    model?: string;
  };
  tts?: {
    provider: 'elevenlabs';
    voiceId?: string;
    model?: string;
  };
  llm?: {
    provider: 'openai';
    model?: string;
    systemPrompt?: string;
  };
}

export interface CallOptions {
  phoneNumber: string;
  agentId?: string;
  campaignId?: string;
  leadId?: string;
  initialMessage?: string;
  voiceId?: string;
}

interface CallStatus {
  status: 'idle' | 'connecting' | 'active' | 'completed' | 'failed';
  callId?: string;
  error?: string;
  duration?: number;
  transcription?: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
  }>;
}

export function useVoicebot(config?: VoicebotConfig) {
  const [callStatus, setCallStatus] = useState<CallStatus>({ status: 'idle' });
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState<string[]>([]);
  const callRef = useRef<any>(null);
  
  // Default configuration
  const defaultConfig: VoicebotConfig = {
    asr: {
      provider: 'whisper',
      language: 'pt-BR',
    },
    tts: {
      provider: 'elevenlabs',
      voiceId: 'FGY2WhTYpPnrIDTdsKH5', // Laura voice for Portuguese
    },
    llm: {
      provider: 'openai',
      model: 'gpt-4o-mini',
    }
  };
  
  const mergedConfig = { ...defaultConfig, ...config };
  
  // Initialize voicebot connection
  useEffect(() => {
    return () => {
      // Cleanup on unmount - terminate any active calls
      if (callStatus.status === 'active' && callRef.current) {
        terminateCall();
      }
    };
  }, []);
  
  // Function to initiate a call using our custom voicebot architecture
  const initiateCall = async (options: CallOptions) => {
    try {
      setIsProcessing(true);
      setCallStatus({ status: 'connecting' });
      
      // Clean the phone number
      const cleanPhone = options.phoneNumber.replace(/\D/g, '');
      
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        throw new Error('Número de telefone inválido');
      }
      
      console.log('Iniciando chamada com voicebot custom:', {
        phoneNumber: cleanPhone,
        agentId: options.agentId,
        campaignId: options.campaignId,
        voiceId: options.voiceId || mergedConfig.tts?.voiceId,
      });
      
      // Call the Edge Function for our custom voicebot
      const { data, error } = await supabase.functions.invoke('voicebot-call', {
        body: {
          phoneNumber: cleanPhone,
          agentId: options.agentId,
          campaignId: options.campaignId,
          leadId: options.leadId,
          initialMessage: options.initialMessage,
          voiceId: options.voiceId || mergedConfig.tts?.voiceId,
          config: mergedConfig
        }
      });
      
      if (error) {
        console.error('Erro ao fazer chamada com voicebot:', error);
        setCallStatus({ 
          status: 'failed', 
          error: error.message 
        });
        throw new Error(`Erro na chamada: ${error.message || 'Falha ao conectar'}`);
      }
      
      console.log('Chamada iniciada com sucesso:', data);
      
      // Store the call reference for later management
      callRef.current = data.callId;
      
      // Update status to active
      setCallStatus({ 
        status: 'active',
        callId: data.callId
      });
      
      // Set up a listener for call updates if supported
      setupCallListener(data.callId);
      
      return data;
    } catch (err: any) {
      console.error('Erro inesperado ao fazer chamada:', err);
      setCallStatus({ 
        status: 'failed',
        error: err.message 
      });
      throw err;
    } finally {
      setIsProcessing(false);
    }
  };
  
  // Set up a listener for call updates
  const setupCallListener = (callId: string) => {
    const channel = supabase
      .channel(`call-${callId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'call_logs',
        filter: `call_sid=eq.${callId}`,
      }, (payload) => {
        console.log('Call update received:', payload);
        
        // Update call status based on the received payload
        if (payload.new) {
          const newStatus = payload.new.status;
          if (newStatus === 'completed' || newStatus === 'failed') {
            setCallStatus({
              status: newStatus,
              callId,
              duration: payload.new.duration || 0,
              transcription: payload.new.transcription || []
            });
            
            // Update transcription if available
            if (payload.new.transcription && Array.isArray(payload.new.transcription)) {
              setTranscription(
                payload.new.transcription.map((t: any) => 
                  `${t.role === 'user' ? 'Cliente' : 'Agente'}: ${t.content}`
                )
              );
            }
          }
        }
      })
      .subscribe();
      
    // Return the channel for cleanup
    return channel;
  };
  
  // Function to terminate an active call
  const terminateCall = async () => {
    if (!callRef.current) {
      console.warn('Nenhuma chamada ativa para encerrar');
      return;
    }
    
    try {
      const { error } = await supabase.functions.invoke('voicebot-terminate', {
        body: {
          callId: callRef.current
        }
      });
      
      if (error) {
        console.error('Erro ao encerrar chamada:', error);
        toast.error(`Erro ao encerrar chamada: ${error.message}`);
        return false;
      }
      
      setCallStatus({
        ...callStatus,
        status: 'completed'
      });
      
      toast.success('Chamada encerrada com sucesso');
      return true;
    } catch (err: any) {
      console.error('Erro inesperado ao encerrar chamada:', err);
      toast.error(`Erro: ${err.message || 'Falha inesperada'}`);
      return false;
    }
  };
  
  return {
    initiateCall,
    terminateCall,
    callStatus,
    isProcessing,
    transcription
  };
}
