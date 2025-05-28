
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Copy, ExternalLink, CheckCircle, AlertCircle, Server } from "lucide-react";
import { toast } from "sonner";

export function WebSocketServerManager() {
  const [serverUrl, setServerUrl] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "connecting" | "connected" | "error">("idle");
  const [testMessage, setTestMessage] = useState("");

  const testWebSocketConnection = async (url: string) => {
    try {
      setConnectionStatus("connecting");
      
      const wsUrl = url.replace(/^https?:\/\//, 'wss://').replace(/^http:\/\//, 'ws://');
      const ws = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        ws.close();
        setConnectionStatus("error");
        toast.error("Timeout de conexão WebSocket");
      }, 5000);
      
      ws.onopen = () => {
        clearTimeout(timeout);
        setConnectionStatus("connected");
        setIsConnected(true);
        toast.success("WebSocket conectado com sucesso!");
        
        // Enviar handshake de teste
        ws.send(JSON.stringify({ event: "connected" }));
      };
      
      ws.onmessage = (event) => {
        console.log("WebSocket response:", event.data);
        setTestMessage(event.data);
      };
      
      ws.onerror = () => {
        clearTimeout(timeout);
        setConnectionStatus("error");
        setIsConnected(false);
        toast.error("Erro na conexão WebSocket");
      };
      
      ws.onclose = () => {
        clearTimeout(timeout);
        if (connectionStatus !== "error") {
          setConnectionStatus("idle");
          setIsConnected(false);
        }
      };
      
    } catch (error) {
      setConnectionStatus("error");
      setIsConnected(false);
      toast.error("Erro ao testar conexão WebSocket");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado para a área de transferência!");
  };

  const getStatusBadge = () => {
    switch (connectionStatus) {
      case "connecting":
        return <Badge className="bg-yellow-100 text-yellow-800">Conectando...</Badge>;
      case "connected":
        return <Badge className="bg-green-100 text-green-800">Conectado</Badge>;
      case "error":
        return <Badge className="bg-red-100 text-red-800">Erro</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconectado</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Server className="mr-2 h-5 w-5" />
            Configuração do Servidor WebSocket Dedicado
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              O Supabase Edge Functions não suporta adequadamente WebSockets persistentes. 
              Um servidor WebSocket dedicado é necessário para o Twilio ConversationRelay funcionar.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="websocket-url">URL do Servidor WebSocket</Label>
            <div className="flex space-x-2">
              <Input
                id="websocket-url"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder="wss://seu-servidor-websocket.herokuapp.com"
                className="flex-1"
              />
              <Button
                onClick={() => testWebSocketConnection(serverUrl)}
                disabled={!serverUrl || connectionStatus === "connecting"}
                variant="outline"
              >
                Testar
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">Status:</span>
              {getStatusBadge()}
            </div>
          </div>

          {testMessage && (
            <div className="p-3 bg-gray-50 rounded border">
              <Label className="text-sm font-medium">Resposta do Servidor:</Label>
              <pre className="text-xs mt-1 text-gray-700">{testMessage}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="deployment" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="deployment">Implantação</TabsTrigger>
          <TabsTrigger value="server-code">Código do Servidor</TabsTrigger>
          <TabsTrigger value="configuration">Configuração</TabsTrigger>
        </TabsList>

        <TabsContent value="deployment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Opções de Implantação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Railway</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Plataforma simples com suporte nativo a WebSockets
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://railway.app', '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Acessar Railway
                  </Button>
                </div>
                
                <div className="p-4 border rounded-lg">
                  <h3 className="font-medium mb-2">Render</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Hosting confiável com deploy automático do GitHub
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => window.open('https://render.com', '_blank')}
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Acessar Render
                  </Button>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Após implantar o servidor, atualize a URL acima e teste a conectividade antes de integrar com o Twilio.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="server-code" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Código do Servidor Node.js</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">package.json</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(`{
  "name": "voxemy-websocket-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "ws": "^8.14.2",
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "axios": "^1.6.0"
  }
}`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
{`{
  "name": "voxemy-websocket-server",
  "version": "1.0.0",
  "main": "server.js",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "ws": "^8.14.2",
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "axios": "^1.6.0"
  }
}`}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">.env</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(`PORT=8080
ELEVENLABS_API_KEY=sua_api_key_aqui
OPENAI_API_KEY=sua_openai_key_aqui`)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <pre className="text-xs bg-gray-50 p-3 rounded border">
{`PORT=8080
ELEVENLABS_API_KEY=sua_api_key_aqui
OPENAI_API_KEY=sua_openai_key_aqui`}
                  </pre>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">server.js (Código principal)</Label>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open('https://gist.github.com/exemplo-servidor-websocket', '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-600">
                    O código completo do servidor está disponível no link acima. 
                    Inclui implementação completa do protocolo ConversationRelay.
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Configuração no Twilio</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="font-medium">TwiML Atualizado</Label>
                <div className="flex items-center justify-between mt-2 mb-2">
                  <span className="text-sm text-gray-600">Use este TwiML após implantar o servidor:</span>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => copyToClipboard(`<Response>
  <Connect>
    <ConversationRelay 
      url="${serverUrl || 'wss://seu-servidor-websocket.com/websocket'}?callSid={{CallSid}}" 
      transcriptionEnabled="true"
      transcriptionLanguage="pt-BR"
      detectSpeechTimeout="2"
      interruptByDtmf="true"
      dtmfInputs="#,*"
    />
  </Connect>
</Response>`)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <pre className="text-xs bg-gray-50 p-3 rounded border overflow-x-auto">
{`<Response>
  <Connect>
    <ConversationRelay 
      url="${serverUrl || 'wss://seu-servidor-websocket.com/websocket'}?callSid={{CallSid}}" 
      transcriptionEnabled="true"
      transcriptionLanguage="pt-BR"
      detectSpeechTimeout="2"
      interruptByDtmf="true"
      dtmfInputs="#,*"
    />
  </Connect>
</Response>`}
                </pre>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Substitua "seu-servidor-websocket.com" pela URL real do seu servidor implantado.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
