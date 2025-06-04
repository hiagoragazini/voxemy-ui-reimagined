
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Smartphone, QrCode, Wifi, WifiOff, RefreshCw, RotateCcw, AlertCircle, CheckCircle } from 'lucide-react';
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
    error,
    connect,
    disconnect,
    sendMessage,
    refreshConnection,
    isConnected,
    isConnecting,
    hasError,
    refreshQrCode
  } = useWhatsAppConnection(agentId);

  const [showQR, setShowQR] = useState(false);

  const handleConnect = async () => {
    setShowQR(false);
    await connect();
  };

  const handleDisconnect = async () => {
    setShowQR(false);
    await disconnect();
  };

  const handleRefreshQR = async () => {
    await refreshQrCode();
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

  const getStatusIcon = () => {
    if (isConnected) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (isConnecting) return <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />;
    if (hasError) return <AlertCircle className="h-5 w-5 text-red-500" />;
    return <WifiOff className="h-5 w-5 text-gray-500" />;
  };

  // Update showQR based on connection state
  useEffect(() => {
    if (isConnected) {
      setShowQR(false);
    } else if (isConnecting && connection?.qr_code) {
      setShowQR(true);
    }
  }, [isConnected, isConnecting, connection?.qr_code]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-6">
          <Loader2 className="h-6 w-6 animate-spin mr-2" />
          <span>Verificando status do WhatsApp...</span>
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
              {getStatusIcon()}
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
                onClick={refreshConnection}
                disabled={isConnecting}
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
              
              {isConnected ? (
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

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                {error}
              </AlertDescription>
            </Alert>
          )}

          {!connection?.status || connection.status === 'disconnected' ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Configuração necessária:</strong> Para usar o WhatsApp em produção, configure as variáveis EVOLUTION_API_URL e EVOLUTION_API_KEY no Supabase.
              </AlertDescription>
            </Alert>
          ) : null}

          {showQR && connection?.qr_code && (
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
              <QRCodeDisplay qrCode={connection.qr_code} />
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

          {isConnecting && !connection?.qr_code && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Preparando conexão WhatsApp... Aguarde o QR Code aparecer.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {isConnected && (
        <MessageLogs agentId={agentId} />
      )}
    </div>
  );
}
