
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, QrCode, Wifi, WifiOff, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { QRCodeDisplay } from './QRCodeDisplay';
import { MessageLogs } from './MessageLogs';

interface WhatsAppConnection {
  id: string;
  agent_id: string;
  instance_id: string | null;
  phone_number: string | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  last_connected_at: string | null;
  created_at: string;
}

interface WhatsAppManagerProps {
  agentId: string;
  agentName: string;
}

export function WhatsAppManager({ agentId, agentName }: WhatsAppManagerProps) {
  const [connection, setConnection] = useState<WhatsAppConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);

  const fetchConnectionStatus = async () => {
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

  const handleConnect = async () => {
    setIsConnecting(true);
    setShowQR(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('whatsapp-manager', {
        body: { action: 'connect', agentId }
      });

      if (error) throw error;

      if (data.qrCode) {
        setQrCode(data.qrCode);
        setShowQR(true);
      }

      setConnection(prev => prev ? { ...prev, status: 'connecting' } : null);
      toast.success('Conectando ao WhatsApp...');
      
      // Poll for connection status
      const pollInterval = setInterval(async () => {
        await fetchConnectionStatus();
        
        if (connection?.status === 'connected') {
          clearInterval(pollInterval);
          setShowQR(false);
          setIsConnecting(false);
          toast.success('WhatsApp conectado com sucesso!');
        }
      }, 3000);

      // Stop polling after 2 minutes
      setTimeout(() => {
        clearInterval(pollInterval);
        setIsConnecting(false);
      }, 120000);
      
    } catch (error) {
      console.error('Error connecting WhatsApp:', error);
      toast.error('Erro ao conectar WhatsApp');
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      const { error } = await supabase.functions.invoke('whatsapp-manager', {
        body: { action: 'disconnect', agentId }
      });

      if (error) throw error;

      setConnection(prev => prev ? { ...prev, status: 'disconnected' } : null);
      setShowQR(false);
      toast.success('WhatsApp desconectado');
    } catch (error) {
      console.error('Error disconnecting WhatsApp:', error);
      toast.error('Erro ao desconectar WhatsApp');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'connected': return 'Conectado';
      case 'connecting': return 'Conectando';
      case 'error': return 'Erro';
      default: return 'Desconectado';
    }
  };

  useEffect(() => {
    fetchConnectionStatus();
  }, [agentId]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="ml-2">Verificando status do WhatsApp...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5" />
            Status do WhatsApp
          </CardTitle>
          <CardDescription>
            Gerencie a conexão do WhatsApp para {agentName}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {connection?.status === 'connected' ? (
                <Wifi className="h-5 w-5 text-green-500" />
              ) : (
                <WifiOff className="h-5 w-5 text-gray-500" />
              )}
              <div>
                <Badge className={getStatusColor(connection?.status || 'disconnected')}>
                  {getStatusText(connection?.status || 'disconnected')}
                </Badge>
                {connection?.last_connected_at && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Última conexão: {new Date(connection.last_connected_at).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchConnectionStatus}
                disabled={isConnecting}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {connection?.status === 'connected' ? (
                <Button
                  variant="destructive"
                  onClick={handleDisconnect}
                  disabled={isConnecting}
                >
                  Desconectar
                </Button>
              ) : (
                <Button
                  onClick={handleConnect}
                  disabled={isConnecting}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isConnecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isConnecting ? 'Conectando...' : 'Conectar WhatsApp'}
                </Button>
              )}
            </div>
          </div>

          {connection?.phone_number && (
            <Alert>
              <Smartphone className="h-4 w-4" />
              <AlertDescription>
                Número conectado: {connection.phone_number}
              </AlertDescription>
            </Alert>
          )}

          {showQR && qrCode && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <QrCode className="h-5 w-5" />
                <h3 className="font-medium">Escaneie o QR Code</h3>
              </div>
              <QRCodeDisplay qrCode={qrCode} />
              <p className="text-sm text-muted-foreground mt-2">
                Abra o WhatsApp no seu celular, vá em "Aparelhos conectados" e escaneie este código.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {connection?.status === 'connected' && (
        <MessageLogs agentId={agentId} />
      )}
    </div>
  );
}
