
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, QrCode, Wifi, WifiOff, RefreshCw, RotateCcw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { QRCodeDisplay } from './QRCodeDisplay';
import { MessageLogs } from './MessageLogs';
import { useWhatsAppConnection } from '@/hooks/use-whatsapp-connection';

interface WhatsAppManagerProps {
  agentId: string;
  agentName: string;
}

export function WhatsAppManager({ agentId, agentName }: WhatsAppManagerProps) {
  const {
    connection,
    isLoading,
    isConnecting,
    qrCode,
    connect,
    disconnect,
    refreshQrCode,
    refresh
  } = useWhatsAppConnection(agentId);

  const [showQR, setShowQR] = useState(false);

  const handleConnect = async () => {
    setShowQR(false);
    
    try {
      await connect();
      setShowQR(true);
    } catch (error) {
      console.error('Connection failed:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      setShowQR(false);
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const handleRefreshQR = async () => {
    try {
      await refreshQrCode();
    } catch (error) {
      console.error('QR refresh failed:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'bg-green-500 hover:bg-green-600';
      case 'connecting': return 'bg-yellow-500 hover:bg-yellow-600';
      case 'error': return 'bg-red-500 hover:bg-red-600';
      default: return 'bg-gray-500 hover:bg-gray-600';
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

  // Update showQR based on connection state
  useEffect(() => {
    if (connection?.status === 'connected') {
      setShowQR(false);
    } else if (connection?.status === 'connecting' && qrCode) {
      setShowQR(true);
    }
  }, [connection?.status, qrCode]);

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
                onClick={refresh}
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

          {!connection?.status || connection.status === 'disconnected' ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Configuração necessária:</strong> Para usar o WhatsApp, você precisa configurar as variáveis de ambiente EVOLUTION_API_URL e EVOLUTION_API_KEY no Supabase.
              </AlertDescription>
            </Alert>
          ) : null}

          {showQR && qrCode && (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5" />
                  <h3 className="font-medium">Escaneie o QR Code</h3>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRefreshQR}
                  disabled={isConnecting}
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
              <QRCodeDisplay qrCode={qrCode} />
              <div className="mt-3 space-y-2">
                <p className="text-sm text-muted-foreground">
                  1. Abra o WhatsApp no seu celular
                </p>
                <p className="text-sm text-muted-foreground">
                  2. Vá em "Aparelhos conectados" ou "WhatsApp Web"
                </p>
                <p className="text-sm text-muted-foreground">
                  3. Toque em "Conectar um aparelho" e escaneie este código
                </p>
              </div>
            </div>
          )}

          {connection?.status === 'connecting' && !qrCode && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Preparando conexão WhatsApp... Aguarde o QR Code aparecer.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {connection?.status === 'connected' && (
        <MessageLogs agentId={agentId} />
      )}
    </div>
  );
}
