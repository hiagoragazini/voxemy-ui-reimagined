
import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { whatsappManager } from '@/lib/whatsapp-manager';

interface WhatsAppConnection {
  id: string;
  agent_id: string;
  instance_id: string | null;
  phone_number: string | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  last_connected_at: string | null;
  created_at: string;
  qr_code: string | null;
}

interface DatabaseConnection {
  id: string;
  agent_id: string;
  instance_id: string | null;
  phone_number: string | null;
  status: string;
  last_connected_at: string | null;
  created_at: string;
  qr_code: string | null;
  updated_at: string;
}

interface UseWhatsAppConnectionReturn {
  connection: WhatsAppConnection | null;
  isLoading: boolean;
  error: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendMessage: (to: string, message: string) => Promise<boolean>;
  refreshConnection: () => Promise<void>;
  isConnected: boolean;
  isConnecting: boolean;
  hasError: boolean;
  refreshQrCode: () => Promise<void>;
}

// Helper function to convert database connection to our type
const convertDbConnection = (dbConn: DatabaseConnection): WhatsAppConnection => {
  const validStatuses: WhatsAppConnection['status'][] = ['connecting', 'connected', 'disconnected', 'error'];
  const status = validStatuses.includes(dbConn.status as any) 
    ? (dbConn.status as WhatsAppConnection['status'])
    : 'disconnected';

  return {
    id: dbConn.id,
    agent_id: dbConn.agent_id,
    instance_id: dbConn.instance_id,
    phone_number: dbConn.phone_number,
    status,
    last_connected_at: dbConn.last_connected_at,
    created_at: dbConn.created_at,
    qr_code: dbConn.qr_code
  };
};

export function useWhatsAppConnection(agentId: string): UseWhatsAppConnectionReturn {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();
  const isMountedRef = useRef(true);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Clear all intervals
  const clearAllIntervals = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  // Safe setState that checks if component is mounted
  const safeSetConnection = useCallback((conn: WhatsAppConnection | null) => {
    if (isMountedRef.current) {
      setConnection(conn);
    }
  }, []);

  const safeSetError = useCallback((err: string | null) => {
    if (isMountedRef.current) {
      setError(err);
    }
  }, []);

  const safeSetLoading = useCallback((loading: boolean) => {
    if (isMountedRef.current) {
      setIsLoading(loading);
    }
  }, []);

  // Fetch connection status
  const fetchConnectionStatus = useCallback(async () => {
    if (!agentId || !isMountedRef.current) return;
    
    try {
      console.log('Fetching connection status for agent:', agentId);
      
      const { data, error } = await supabase
        .from('whatsapp_connections')
        .select('*')
        .eq('agent_id', agentId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching status:', error);
        throw error;
      }

      console.log('Connection status response:', data);
      
      if (data) {
        const convertedData = convertDbConnection(data as DatabaseConnection);
        safeSetConnection(convertedData);
      } else {
        safeSetConnection(null);
      }
      
      safeSetError(null);
      
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
      safeSetError('Erro ao verificar status do WhatsApp');
      if (isMountedRef.current) {
        toast({
          title: "Erro",
          description: "Erro ao verificar status do WhatsApp",
          variant: "destructive"
        });
      }
    } finally {
      safeSetLoading(false);
    }
  }, [agentId, safeSetConnection, safeSetError, safeSetLoading, toast]);

  // Connect function
  const connect = useCallback(async () => {
    if (!agentId || !isMountedRef.current) return;
    
    clearAllIntervals();
    safeSetError(null);
    
    try {
      console.log('Initiating WhatsApp connection for agent:', agentId);
      
      if (isMountedRef.current) {
        toast({
          title: "Conectando",
          description: "Iniciando conexão WhatsApp...",
        });
      }

      const result = await whatsappManager.createConnection(agentId);

      if (!result) {
        throw new Error('Falha ao criar conexão');
      }

      if (!isMountedRef.current) return;

      const dbConnection: WhatsAppConnection = {
        id: result.id,
        agent_id: result.agentId,
        instance_id: result.instanceId,
        phone_number: result.phoneNumber || null,
        status: result.status as WhatsAppConnection['status'],
        last_connected_at: result.status === 'connected' ? new Date().toISOString() : null,
        created_at: new Date().toISOString(),
        qr_code: result.qrCode || null
      };

      safeSetConnection(dbConnection);

      if (result.status === 'connecting') {
        if (isMountedRef.current) {
          toast({
            title: "QR Code",
            description: "QR Code gerado! Escaneie para conectar.",
          });
        }
        startPolling();
      } else if (result.status === 'connected') {
        if (isMountedRef.current) {
          toast({
            title: "Conectado",
            description: "WhatsApp conectado com sucesso!",
          });
        }
      } else if (result.status === 'error') {
        throw new Error(result.errorMessage || 'Erro desconhecido');
      }

    } catch (error: any) {
      console.error('Error connecting WhatsApp:', error);
      safeSetError(error.message || 'Erro desconhecido');
      if (isMountedRef.current) {
        toast({
          title: "Erro",
          description: `Erro ao conectar WhatsApp: ${error.message}`,
          variant: "destructive"
        });
      }
    }
  }, [agentId, clearAllIntervals, safeSetConnection, safeSetError, toast]);

  // Disconnect function
  const disconnect = useCallback(async () => {
    if (!agentId || !isMountedRef.current) return;
    
    clearAllIntervals();
    
    try {
      console.log('Disconnecting WhatsApp for agent:', agentId);
      
      const success = await whatsappManager.disconnectAgent(agentId);

      if (success) {
        const updatedConnection: WhatsAppConnection = {
          ...connection!,
          status: 'disconnected',
          phone_number: null,
          qr_code: null
        };
        safeSetConnection(updatedConnection);
        
        if (isMountedRef.current) {
          toast({
            title: "Desconectado",
            description: "WhatsApp desconectado com sucesso",
          });
        }
      } else {
        throw new Error('Falha ao desconectar');
      }

    } catch (error: any) {
      console.error('Error disconnecting WhatsApp:', error);
      safeSetError(error.message || 'Erro desconhecido');
      if (isMountedRef.current) {
        toast({
          title: "Erro",
          description: `Erro ao desconectar WhatsApp: ${error.message}`,
          variant: "destructive"
        });
      }
    }
  }, [agentId, connection, clearAllIntervals, safeSetConnection, safeSetError, toast]);

  // Send message function
  const sendMessage = useCallback(async (to: string, message: string): Promise<boolean> => {
    if (!agentId) return false;
    
    try {
      const success = await whatsappManager.sendMessage(agentId, to, message);
      
      if (success && isMountedRef.current) {
        toast({
          title: "Mensagem enviada",
          description: "Mensagem enviada com sucesso",
        });
      }
      
      return success;
    } catch (error: any) {
      console.error('Error sending message:', error);
      if (isMountedRef.current) {
        toast({
          title: "Erro",
          description: `Erro ao enviar mensagem: ${error.message}`,
          variant: "destructive"
        });
      }
      return false;
    }
  }, [agentId, toast]);

  // Refresh QR Code function
  const refreshQrCode = useCallback(async () => {
    if (!connection?.instance_id || !isMountedRef.current) {
      if (isMountedRef.current) {
        toast({
          title: "Erro",
          description: "Nenhuma instância ativa para atualizar QR Code",
          variant: "destructive"
        });
      }
      return;
    }
    
    try {
      await connect();
    } catch (error: any) {
      console.error('Error refreshing QR code:', error);
      if (isMountedRef.current) {
        toast({
          title: "Erro",
          description: `Erro ao atualizar QR Code: ${error.message}`,
          variant: "destructive"
        });
      }
    }
  }, [connection?.instance_id, connect, toast]);

  // Smart polling - only when connecting
  const startPolling = useCallback(() => {
    if (pollingIntervalRef.current) return;
    
    let attempts = 0;
    const maxAttempts = 60; // 10 minutes with 10-second intervals

    pollingIntervalRef.current = setInterval(async () => {
      attempts++;
      
      if (!isMountedRef.current || attempts >= maxAttempts) {
        clearAllIntervals();
        if (isMountedRef.current && attempts >= maxAttempts) {
          toast({
            title: "Timeout",
            description: "Tempo limite para conexão. Tente novamente.",
            variant: "destructive"
          });
        }
        return;
      }

      try {
        await fetchConnectionStatus();
        
        if (connection?.status === 'connected' || connection?.status === 'error') {
          clearAllIntervals();
        }
      } catch (error) {
        console.error('Error polling status:', error);
      }
    }, 10000); // 10 seconds
  }, [clearAllIntervals, connection?.status, fetchConnectionStatus, toast]);

  // Set up real-time subscription for connection updates
  useEffect(() => {
    if (!agentId) return;

    const channel = supabase
      .channel('whatsapp_connection_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'whatsapp_connections',
          filter: `agent_id=eq.${agentId}`
        },
        (payload) => {
          console.log('Real-time connection update:', payload);
          if (payload.new && isMountedRef.current) {
            const newConnection = convertDbConnection(payload.new as DatabaseConnection);
            safeSetConnection(newConnection);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId, safeSetConnection]);

  // Initial fetch
  useEffect(() => {
    if (agentId) {
      fetchConnectionStatus();
    }
  }, [agentId, fetchConnectionStatus]);

  // Cleanup on unmount or agentId change
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      clearAllIntervals();
    };
  }, [clearAllIntervals]);

  // Update isMountedRef when component mounts
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Derived states
  const isConnected = connection?.status === 'connected';
  const isConnecting = connection?.status === 'connecting';
  const hasError = connection?.status === 'error';

  return {
    connection,
    isLoading,
    error,
    connect,
    disconnect,
    sendMessage,
    refreshConnection: fetchConnectionStatus,
    isConnected,
    isConnecting,
    hasError,
    refreshQrCode
  };
}
