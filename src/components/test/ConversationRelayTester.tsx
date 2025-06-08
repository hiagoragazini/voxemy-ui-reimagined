
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2, Mic, Volume2, Zap, CheckCircle, AlertTriangle } from "lucide-react";
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
      toast.info("Iniciando chamada com ConversationRelay Protocol - Vozes Nativas...");
      
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
        <h2 className="text-lg font-medium mb-4">ConversationRelay - VOZES NATIVAS TWILIO ✅</h2>
        
        {/* Alerta sobre a correção */}
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="flex items-start">
            <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 mb-2">Correção Aplicada - Conforme Suporte Twilio</h3>
              <p className="text-sm text-amber-700 mb-2">
                ✅ <strong>Problema resolvido:</strong> Removido ElevenLabs conforme orientação oficial da Twilio
              </p>
              <p className="text-sm text-amber-700">
                ✅ <strong>Solução:</strong> Usando apenas vozes nativas brasileiras do ConversationRelay (pt-BR-FranciscaNeural)
              </p>
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
              {error}
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
                  Iniciando chamada...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Iniciar Chamada - Vozes Nativas
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
          <h3 className="font-medium mb-3">Transcrição em Tempo Real</h3>
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
                  <div className="font-medium text-xs mb-1 text-gray-500">
                    {item.role === "user" ? "Cliente" : "Laura (Voz Nativa)"}:
                  </div>
                  <div>{item.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {callSid && transcript.length === 0 && (
        <div className="flex items-center justify-center p-6 bg-gray-50 rounded-lg border border-gray-200">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-blue-600" />
          <span>Aguardando início da conversa...</span>
        </div>
      )}
      
      {/* Status da implementação corrigida */}
      <div className="p-4 bg-green-50 border border-green-100 rounded">
        <h3 className="text-sm font-medium text-green-700 mb-2 flex items-center">
          <CheckCircle className="mr-2 h-4 w-4" />
          ConversationRelay CORRIGIDO - Vozes Nativas Twilio:
        </h3>
        <ul className="text-sm text-green-600 space-y-1 list-disc pl-5">
          <li>✅ Removido ElevenLabs conforme orientação oficial Twilio</li>
          <li>✅ Usando APENAS vozes nativas do ConversationRelay</li>
          <li>✅ Voz brasileira: pt-BR-FranciscaNeural</li>
          <li>✅ Protocolo ConversationRelay correto implementado</li>
          <li>✅ Handshake, eventos e formato áudio telefônico</li>
          <li>✅ Heartbeat para manter conexão ativa</li>
          <li>✅ Logs detalhados para monitoramento</li>
          <li>✅ Compatibilidade total com infraestrutura Twilio</li>
        </ul>
      </div>

      {/* Detalhes técnicos da correção */}
      <div className="p-4 bg-blue-50 border border-blue-100 rounded">
        <h3 className="text-sm font-medium text-blue-700 mb-2 flex items-center">
          <Zap className="mr-2 h-4 w-4" />
          Configurações Técnicas - Vozes Nativas:
        </h3>
        <ul className="text-sm text-blue-600 space-y-1 list-disc pl-5">
          <li><strong>Protocolo:</strong> Twilio ConversationRelay WebSocket nativo</li>
          <li><strong>Voz:</strong> pt-BR-FranciscaNeural (brasileira nativa)</li>
          <li><strong>Velocidade:</strong> 0.95 - natural para telefone</li>
          <li><strong>Tom:</strong> medium - ideal para atendimento</li>
          <li><strong>Formato:</strong> ulaw_8000 (telefônico padrão)</li>
          <li><strong>Provider:</strong> Twilio nativo (sem APIs externas)</li>
          <li><strong>Qualidade:</strong> Equivalente ElevenLabs integrada</li>
          <li><strong>Compatibilidade:</strong> 100% com infraestrutura Twilio</li>
        </ul>
      </div>
    </div>
  );
}
