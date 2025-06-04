
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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

export function useWhatsAppConnection(agentId: string) {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const fetchConnectionStatus = async () => {
    if (!agentId) return;
    
    try {
      console.log('Fetching connection status for agent:', agentId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        body: { action: 'status', agentId }
      });

      if (error) {
        console.error('Error fetching status:', error);
        throw error;
      }

      console.log('Connection status response:', data);
      setConnection(data);
      
      // Update QR code if available
      if (data?.qr_code) {
        setQrCode(data.qr_code);
      }
      
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
      toast.error('Erro ao verificar status do WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    setQrCode(null);
    
    try {
      console.log('Initiating WhatsApp connection for agent:', agentId);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        body: { action: 'connect', agentId }
      });

      if (error) {
        console.error('Connection error:', error);
        throw error;
      }

      console.log('Connect response:', data);

      // Update connection state
      setConnection(prev => prev ? { 
        ...prev, 
        status: 'connecting',
        qr_code: data.qrCode 
      } : null);
      
      if (data.qrCode) {
        setQrCode(data.qrCode);
        toast.success('QR Code gerado! Escaneie para conectar.');
      } else {
        toast.success('Conectando ao WhatsApp... QR Code será gerado em breve.');
      }

      // Poll for connection status every 3 seconds
      const pollInterval = setInterval(async () => {
        try {
          const statusResponse = await supabase.functions.invoke('whatsapp-manager', {
            body: { action: 'status', agentId }
          });
          
          if (statusResponse.data?.status === 'connected') {
            clearInterval(pollInterval);
            setIsConnecting(false);
            setQrCode(null);
            setConnection(statusResponse.data);
            toast.success('WhatsApp conectado com sucesso!');
          } else if (statusResponse.data?.qr_code && statusResponse.data.qr_code !== qrCode) {
            // QR code updated
            setQrCode(statusResponse.data.qr_code);
            setConnection(prev => prev ? {
              ...prev,
              qr_code: statusResponse.data.qr_code
            } : null);
          }
        } catch (error) {
          console.error('Error polling status:', error);
        }
      }, 3000);

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        if (isConnecting) {
          setIsConnecting(false);
          toast.error('Tempo limite para conexão. Tente novamente.');
        }
      }, 120000);
      
      return data;
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
      toast.error('Erro ao conectar WhatsApp: ' + (error.message || 'Erro desconhecido'));
      setIsConnecting(false);
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      console.log('Disconnecting WhatsApp for agent:', agentId);
      
      const { error } = await supabase.functions.invoke('whatsapp-manager', {
        body: { action: 'disconnect', agentId }
      });

      if (error) throw error;

      setConnection(prev => prev ? { 
        ...prev, 
        status: 'disconnected',
        phone_number: null,
        qr_code: null
      } : null);
      setQrCode(null);
      toast.success('WhatsApp desconectado');
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast.error('Erro ao desconectar WhatsApp: ' + (error.message || 'Erro desconhecido'));
      throw error;
    }
  };

  const refreshQrCode = async () => {
    if (!connection?.instance_id) {
      toast.error('Nenhuma instância ativa para atualizar QR Code');
      return;
    }
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        body: { action: 'qrcode', agentId }
      });

      if (error) throw error;

      if (data?.qrCode) {
        setQrCode(data.qrCode);
        setConnection(prev => prev ? {
          ...prev,
          qr_code: data.qrCode
        } : null);
        toast.success('QR Code atualizado!');
      } else {
        toast.error('QR Code não disponível no momento');
      }
    } catch (error) {
      console.error('Error refreshing QR code:', error);
      toast.error('Erro ao atualizar QR Code: ' + (error.message || 'Erro desconhecido'));
    }
  };

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
          if (payload.new) {
            setConnection(payload.new as WhatsAppConnection);
            if (payload.new.qr_code) {
              setQrCode(payload.new.qr_code);
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [agentId]);

  useEffect(() => {
    if (agentId) {
      fetchConnectionStatus();
    }
  }, [agentId]);

  return {
    connection,
    isLoading,
    isConnecting,
    qrCode,
    connect,
    disconnect,
    refreshQrCode,
    refresh: fetchConnectionStatus
  };
}
