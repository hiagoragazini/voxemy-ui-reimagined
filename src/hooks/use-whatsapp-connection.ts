
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
}

export function useWhatsAppConnection(agentId: string) {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  const fetchConnectionStatus = async () => {
    if (!agentId) return;
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        body: { action: 'status', agentId }
      });

      if (error) throw error;
      setConnection(data);
    } catch (error) {
      console.error('Error fetching WhatsApp status:', error);
      toast.error('Erro ao verificar status do WhatsApp');
    } finally {
      setIsLoading(false);
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        body: { action: 'connect', agentId }
      });

      if (error) throw error;

      setConnection(prev => prev ? { ...prev, status: 'connecting' } : null);
      toast.success('Conectando ao WhatsApp...');
      
      return data;
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
      toast.error('Erro ao conectar WhatsApp');
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      const { error } = await supabase.functions.invoke('whatsapp-manager', {
        body: { action: 'disconnect', agentId }
      });

      if (error) throw error;

      setConnection(prev => prev ? { ...prev, status: 'disconnected' } : null);
      toast.success('WhatsApp desconectado');
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast.error('Erro ao desconectar WhatsApp');
      throw error;
    }
  };

  useEffect(() => {
    if (agentId) {
      fetchConnectionStatus();
    }
  }, [agentId]);

  return {
    connection,
    isLoading,
    isConnecting,
    connect,
    disconnect,
    refresh: fetchConnectionStatus
  };
}
