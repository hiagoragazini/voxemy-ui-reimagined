
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2, CheckCircle, AlertTriangle, Zap, Server } from "lucide-react";
import { useConversationRelay, CallTranscript } from "@/hooks/use-conversation-relay";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function ConversationRelayTester() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agentId, setAgentId] = useState("");
  const [isTestMode, setIsTestMode] = useState(true);
  
  const { 
    makeCall, 
    isLoading, 
    callSid, 
    callStatus, 
    error, 
    transcript 
  } = useConversationRelay();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only numbers
    const value = e.target.value.replace(/\D/g, "");
    setPhoneNumber(value);
  };

  const handleCallClick = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Por favor, insira um número de telefone válido");
      return;
    }
    
    try {
      toast.info("🚀 Iniciando chamada ConversationRelay CORRIGIDO - Sistema Completo...");
      
      await makeCall({ 
        phoneNumber,
        agentId: agentId || undefined,
        testMode: isTestMode
      });
    } catch (err) {
      console.error("Erro ao iniciar chamada:", err);
      toast.error("Falha ao iniciar a chamada");
    }
  };

  const getStatusBadge = () => {
    if (!callStatus) return null;
    
    let color = "bg-gray-100 text-gray-800";
    
    switch (callStatus) {
      case "queued":
      case "initiated":
        color = "bg-blue-100 text-blue-800";
        break;
      case "ringing":
        color = "bg-yellow-100 text-yellow-800";
        break;
      case "in-progress":
      case "conversation_active":
        color = "bg-green-100 text-green-800";
        break;
      case "completed":
        color = "bg-purple-100 text-purple-800";
        break;
      case "busy":
      case "failed":
      case "no-answer":
      case "canceled":
        color = "bg-red-100 text-red-800";
        break;
    }
    
    return <Badge className={color}>{callStatus}</Badge>;
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <h2 className="text-lg font-medium mb-4">ConversationRelay CORRIGIDO - Sistema Completo ✅</h2>
        
        {/* Status das correções aplicadas */}
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-green-800 mb-2">✅ Sistema CORRIGIDO - Todas as Melhorias Aplicadas</h3>
              <ul className="text-sm text-green-700 space-y-1 list-disc pl-5">
                <li><strong>Autenticação Edge Function:</strong> verify_jwt = false (corrigido erro 401)</li>
                <li><strong>Servidor WebSocket:</strong> Railway dedicado com protocolo ConversationRelay completo</li>
                <li><strong>Vozes Nativas:</strong> pt-BR-FranciscaNeural integrada ao Twilio</li>
                <li><strong>Logs Detalhados:</strong> Monitoramento completo da conversa</li>
                <li><strong>Fallback Robusto:</strong> Sistema de backup automático</li>
                <li><strong>Protocolo Completo:</strong> Handshake, eventos e áudio telefônico</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-number">Número de telefone</Label>
            <Input
              id="phone-number"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="Ex: 11999887766 (apenas números)"
              type="tel"
              disabled={isLoading || !!callSid}
            />
            <p className="text-xs text-muted-foreground">
              Digite apenas números, incluindo DDD (ex: 11999887766)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="agent-id">ID do Agente (opcional)</Label>
            <Input
              id="agent-id"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="ID do agente para personalização"
              disabled={isLoading || !!callSid}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="test-mode"
              checked={isTestMode}
              onCheckedChange={setIsTestMode}
              disabled={isLoading || !!callSid}
            />
            <Label htmlFor="test-mode">
              <span className={isTestMode ? "text-blue-600 font-medium" : ""}>
                Modo de teste (sem realizar chamada real)
              </span>
            </Label>
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              ❌ {error}
            </div>
          )}
          
          {!callSid ? (
            <Button 
              onClick={handleCallClick} 
              disabled={isLoading || !phoneNumber}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando chamada CORRIGIDA...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Iniciar Chamada - Sistema CORRIGIDO
                </>
              )}
            </Button>
          ) : (
            <div className="flex flex-col space-y-2 items-center justify-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center mb-2">
                <span className="font-medium mr-2">Status:</span>
                {getStatusBadge()}
              </div>
              <div className="text-sm">
                <span className="font-medium">ID da chamada:</span> {callSid}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Transcrição em tempo real */}
      {callSid && transcript.length > 0 && (
        <div className="mt-6">
          <h3 className="font-medium mb-3">📝 Transcrição em Tempo Real - Sistema CORRIGIDO</h3>
          <div className="border rounded-md overflow-hidden">
            <div className="max-h-80 overflow-y-auto p-4 space-y-3">
              {transcript.map((item: CallTranscript, index: number) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg ${
                    item.role === "user"
                      ? "bg-gray-100 ml-6"
                      : "bg-blue-50 mr-6"
                  }`}
                >
                  <div className="font-medium text-xs mb-1 text-gray-500 flex items-center justify-between">
                    <span>{item.role === "user" ? "Cliente" : "Laura (Voz Nativa CORRIGIDA)"}</span>
                    {item.confidence && (
                      <span className="text-xs text-gray-400">
                        Confiança: {Math.round(item.confidence * 100)}%
                      </span>
                    )}
                  </div>
                  <div>{item.text}</div>
                  {item.timestamp && (
                    <div className="text-xs text-gray-400 mt-1">
                      {new Date(item.timestamp).toLocaleTimeString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {callSid && transcript.length === 0 && (
        <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
          <span>Aguardando início da conversa com sistema CORRIGIDO...</span>
        </div>
      )}
      
      {/* Status das implementações corrigidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-green-50 border border-green-100 rounded">
          <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center">
            <CheckCircle className="mr-2 h-4 w-4" />
            Correções Aplicadas:
          </h3>
          <ul className="text-sm text-green-600 space-y-1 list-disc pl-5">
            <li>✅ Edge Function autenticação corrigida</li>
            <li>✅ Servidor Railway WebSocket dedicado</li>
            <li>✅ Protocolo ConversationRelay completo</li>
            <li>✅ Vozes nativas brasileiras integradas</li>
            <li>✅ Logs detalhados implementados</li>
            <li>✅ Sistema de fallback robusto</li>
            <li>✅ Handshake e eventos corretos</li>
            <li>✅ Monitoramento em tempo real</li>
          </ul>
        </div>

        <div className="p-4 bg-blue-50 border border-blue-100 rounded">
          <h3 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
            <Server className="mr-2 h-4 w-4" />
            Infraestrutura CORRIGIDA:
          </h3>
          <ul className="text-sm text-blue-600 space-y-1 list-disc pl-5">
            <li><strong>Servidor:</strong> Railway dedicado (Node.js)</li>
            <li><strong>Protocolo:</strong> ConversationRelay completo</li>
            <li><strong>Voz:</strong> pt-BR-FranciscaNeural nativa</li>
            <li><strong>Auth:</strong> verify_jwt = false (corrigido)</li>
            <li><strong>Logs:</strong> Supabase + Console detalhados</li>
            <li><strong>Fallback:</strong> Supabase WebSocket backup</li>
            <li><strong>Formato:</strong> ulaw_8000 telefônico</li>
            <li><strong>Timeout:</strong> 3s detecção de fala</li>
          </ul>
        </div>
      </div>

      {/* Instruções de teste */}
      <div className="p-4 bg-amber-50 border border-amber-100 rounded">  
        <h3 className="text-sm font-medium text-amber-700 mb-2 flex items-center">
          <Zap className="mr-2 h-4 w-4" />
          Como Testar o Sistema CORRIGIDO:
        </h3>
        <ol className="text-sm text-amber-600 space-y-1 list-decimal pl-5">
          <li>Configure EXTERNAL_WEBSOCKET_URL no Supabase: https://voxemy-websocket-server-production.up.railway.app</li>
          <li>Desabilite "Modo de teste" para chamadas reais</li>
          <li>Insira um número válido (incluindo DDD)</li>
          <li>Clique em "Iniciar Chamada - Sistema CORRIGIDO"</li>
          <li>Aguarde a chamada (agora deve funcionar sem erro 401)</li>
          <li>Converse normalmente - Laura responderá com voz nativa</li>
          <li>Monitore a transcrição em tempo real</li>
        </ol>
      </div>
    </div>
  );
}
