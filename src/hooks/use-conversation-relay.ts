import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CallTranscript {
  role: "user" | "assistant";
  text: string;
  timestamp?: string;
}

export function useConversationRelay() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPolling, setIsPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<CallTranscript[]>([]);
  const [lastPolled, setLastPolled] = useState<number>(0);

  // Function to make a Vapi AI call
  const makeCall = useCallback(async ({
    phoneNumber, 
    agentId, 
    campaignId, 
    leadId,
    testMode = false,
    assistantId
  }: {
    phoneNumber: string;
    agentId?: string;
    campaignId?: string;
    leadId?: string;
    testMode?: boolean;
    assistantId?: string;
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
      
      console.log("Iniciando chamada Vapi AI:", {
        phoneNumber: cleanPhone,
        agentId,
        campaignId,
        leadId,
        testMode,
        assistantId
      });

      if (testMode) {
        // Simulate a test call
        const simulatedCallId = `vapi_test_${Date.now()}`;
        setCallSid(simulatedCallId);
        setCallStatus("in-progress");
        toast.success("Chamada de teste simulada (Vapi AI)");
        
        // Simulate transcript after a delay
        setTimeout(() => {
          setTranscript([
            {
              role: "assistant",
              text: "Olá! Aqui é a Voxemy via Vapi AI. Como posso te ajudar hoje?",
              timestamp: new Date().toISOString()
            }
          ]);
        }, 2000);
        
        return { success: true, callSid: simulatedCallId, status: "in-progress" };
      }
      
      // Prepare payload with proper parameter handling using Record type
      const payload: Record<string, any> = {
        phoneNumber: cleanPhone,
        message: "Olá! Aqui é a Voxemy via Vapi AI. Como posso te ajudar hoje?"
      };

      // Only add non-empty parameters
      if (agentId && agentId.trim()) {
        payload.agentId = agentId;
      }
      if (campaignId && campaignId.trim()) {
        payload.campaignId = campaignId;
      }
      if (leadId && leadId.trim()) {
        payload.leadId = leadId;
      }
      if (assistantId && assistantId.trim()) {
        payload.assistantId = assistantId;
      }

      console.log("Payload sendo enviado para make-vapi-call:", payload);
      
      // Call the Vapi edge function
      const { data, error } = await supabase.functions.invoke("make-vapi-call", {
        body: payload
      });
      
      if (error) {
        console.error("Erro ao fazer chamada Vapi:", error);
        throw new Error(error.message || "Falha ao conectar");
      }
      
      console.log("Chamada Vapi iniciada com sucesso:", data);
      
      if (data.success && data.callId) {
        setCallSid(data.callId);
        setCallStatus(data.status);
        
        // Start polling for call status and transcripts
        startPolling(data.callId);
        
        toast.success("Chamada iniciada com sucesso via Vapi AI!");
        return data;
      } else {
        throw new Error("Resposta inválida do servidor");
      }
    } catch (err: any) {
      console.error("Erro inesperado ao fazer chamada:", err);
      setError(err.message || "Falha inesperada");
      toast.error(`Erro: ${err.message || "Falha inesperada"}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Start polling for call status and transcript updates
  const startPolling = useCallback((callId: string) => {
    if (isPolling) return;
    
    setIsPolling(true);
    setLastPolled(Date.now());
    
    const pollInterval = setInterval(async () => {
      try {
        // Only poll if we haven't polled in the last 2 seconds
        if (Date.now() - lastPolled < 2000) {
          return;
        }
        
        setLastPolled(Date.now());
        
        // Fetch call status and transcript from our database
        const { data, error } = await supabase
          .from("call_logs")
          .select("status, transcription")
          .eq("call_sid", callId)
          .single();
          
        if (error) {
          console.error("Erro ao buscar status da chamada:", error);
          return;
        }
        
        // Update call status
        if (data && data.status) {
          setCallStatus(data.status);
          
          // Stop polling if call is completed/failed
          if (["completed", "failed", "busy", "no-answer", "canceled"].includes(data.status)) {
            clearInterval(pollInterval);
            setIsPolling(false);
          }
        }
        
        // Update transcript if available
        if (data && data.transcription) {
          try {
            const transcriptData = JSON.parse(data.transcription);
            if (Array.isArray(transcriptData)) {
              // Convert Vapi transcript format to our format
              const formattedTranscript: CallTranscript[] = transcriptData.map((item: any) => ({
                role: (item.role === "user" ? "user" : "assistant") as "user" | "assistant",
                text: item.content || item.text || "",
                timestamp: item.timestamp
              }));
              setTranscript(formattedTranscript);
            }
          } catch (parseError) {
            console.error("Erro ao analisar transcrição:", parseError);
          }
        }
      } catch (pollError) {
        console.error("Erro durante polling:", pollError);
      }
    }, 3000); // Poll every 3 seconds
    
    // Clean up interval on unmount
    return () => {
      clearInterval(pollInterval);
      setIsPolling(false);
    };
  }, [isPolling, lastPolled]);
  
  // Stop polling explicitly
  const stopPolling = useCallback(() => {
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
