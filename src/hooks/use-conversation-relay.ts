
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CallTranscript {
  role: "user" | "assistant";
  text: string;
  timestamp?: string;
  confidence?: number;
}

export function useConversationRelay() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<CallTranscript[]>([]);
  const [lastPolled, setLastPolled] = useState<number>(0);

  // Function to make a conversation relay call
  const makeCall = useCallback(async ({
    phoneNumber, 
    agentId, 
    campaignId, 
    leadId,
    testMode = false
  }: {
    phoneNumber: string;
    agentId?: string;
    campaignId?: string;
    leadId?: string;
    testMode?: boolean;
  }) => {
    try {
      setIsLoading(true);
      setError(null);
      setCallSid(null);
      setCallStatus(null);
      setTranscript([]);
      
      // Clean the phone number by removing any non-digit characters
      const cleanPhone = phoneNumber.replace(/\D/g, "");
      
      // Check if the phone number is valid (has 10-15 digits)
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        throw new Error("Número de telefone inválido");
      }
      
      console.log("🚀 Iniciando chamada ConversationRelay CORRIGIDO:", {
        phoneNumber: cleanPhone,
        agentId,
        campaignId,
        leadId,
        testMode,
        timestamp: new Date().toISOString()
      });
      
      // Call the Edge Function to make the call (sem autenticação JWT)
      const { data, error } = await supabase.functions.invoke("make-conversation-call", {
        body: {
          phoneNumber: cleanPhone,
          agentId,
          campaignId,
          leadId,
          testMode
        }
      });
      
      if (error) {
        console.error("❌ Erro na edge function:", error);
        throw new Error(error.message || "Falha ao conectar com o servidor");
      }
      
      console.log("✅ Chamada iniciada com sucesso - Sistema CORRIGIDO:", data);
      
      if (data.success && data.callSid) {
        setCallSid(data.callSid);
        setCallStatus(data.status);
        
        // Start polling for call status and transcripts
        startPolling(data.callSid);
        
        toast.success("🎉 Chamada iniciada! ConversationRelay CORRIGIDO ativo com vozes nativas.");
        return data;
      } else {
        throw new Error(data.message || "Resposta inválida do servidor");
      }
    } catch (err: any) {
      console.error("❌ Erro inesperado ao fazer chamada:", err);
      setError(err.message || "Falha inesperada");
      toast.error(`❌ Erro: ${err.message || "Falha inesperada"}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Start polling for call status and transcript updates
  const startPolling = useCallback((sid: string) => {
    if (isPolling) return;
    
    setIsPolling(true);
    setLastPolled(Date.now());
    
    console.log(`🔄 Iniciando polling para CallSid: ${sid}`);
    
    const pollInterval = setInterval(async () => {
      try {
        // Only poll if we haven't polled in the last 2 seconds
        if (Date.now() - lastPolled < 2000) {
          return;
        }
        
        setLastPolled(Date.now());
        
        // Fetch call status and transcript
        const { data, error } = await supabase
          .from("call_logs")
          .select("status, transcription, conversation_relay_active, conversation_log, websocket_url")
          .eq("call_sid", sid)
          .maybeSingle();
          
        if (error) {
          console.error("❌ Erro ao buscar status da chamada:", error);
          return;
        }
        
        if (!data) {
          console.log(`⚠️ Nenhum log encontrado para CallSid: ${sid}`);
          return;
        }
        
        console.log(`📊 Status da chamada:`, {
          status: data.status,
          hasTranscription: !!data.transcription,
          relayActive: data.conversation_relay_active,
          hasLog: !!data.conversation_log,
          websocketUrl: data.websocket_url
        });
        
        // Update call status
        if (data.status) {
          setCallStatus(data.status);
          
          // Stop polling if call is completed/failed
          if (["completed", "failed", "busy", "no-answer", "canceled"].includes(data.status)) {
            console.log(`🏁 Chamada finalizada com status: ${data.status}`);
            clearInterval(pollInterval);
            setIsPolling(false);
          }
        }
        
        // Update transcript if available
        if (data.transcription) {
          try {
            const transcriptData = JSON.parse(data.transcription);
            if (Array.isArray(transcriptData) && transcriptData.length > 0) {
              console.log(`📝 Transcrição atualizada: ${transcriptData.length} mensagens`);
              setTranscript(transcriptData);
            }
          } catch (parseError) {
            console.error("❌ Erro ao analisar transcrição:", parseError);
          }
        }
        
        // Parse conversation log for real-time updates
        if (data.conversation_log) {
          try {
            const logData = typeof data.conversation_log === 'string' 
              ? JSON.parse(data.conversation_log) 
              : data.conversation_log;
            console.log(`📋 Log da conversa atualizado:`, logData);
          } catch (parseError) {
            console.error("❌ Erro ao analisar log da conversa:", parseError);
          }
        }
      } catch (pollError) {
        console.error("❌ Erro durante polling:", pollError);
      }
    }, 3000); // Poll every 3 seconds
    
    // Clean up interval on unmount
    return () => {
      console.log(`🛑 Parando polling para CallSid: ${sid}`);
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [isPolling, lastPolled]);
  
  // Stop polling explicitly
  const stopPolling = useCallback(() => {
    console.log("🛑 Polling parado manualmente");
    setIsPolling(false);
  }, []);

  return {
    makeCall,
    stopPolling,
    isLoading,
    isPolling,
    error,
    callSid,
    callStatus,
    transcript
  };
}
