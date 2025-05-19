import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2 } from "lucide-react";
import { useConversationRelay, CallTranscript } from "@/hooks/use-conversation-relay";
import { Badge } from "@/components/ui/badge";

export function ConversationRelayTester() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agentId, setAgentId] = useState("");
  
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
    if (!phoneNumber.trim()) return;
    
    try {
      await makeCall({ 
        phoneNumber,
        agentId: agentId || undefined
      });
    } catch (err) {
      console.error("Erro ao iniciar chamada:", err);
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
        <h2 className="text-lg font-medium mb-4">Teste do Twilio ConversationRelay</h2>
        
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
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
              {error}
            </div>
          )}
          
          {!callSid ? (
            <Button 
              onClick={handleCallClick} 
              disabled={isLoading || !phoneNumber}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Iniciando chamada...
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Iniciar Chamada Interativa
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
                    {item.role === "user" ? "Cliente" : "Assistente"}:
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
      
      <div className="p-4 bg-blue-50 border border-blue-100 rounded">
        <h3 className="text-sm font-medium text-blue-700 mb-2">Como funciona:</h3>
        <ul className="text-sm text-blue-600 space-y-1 list-disc pl-5">
          <li>Esta funcionalidade usa o Twilio ConversationRelay para conversação bidirecional em tempo real</li>
          <li>O áudio é transcrito continuamente durante a chamada</li>
          <li>As respostas são geradas por uma IA e convertidas em fala</li>
          <li>Toda a conversa é salva para análise posterior</li>
          <li>Esta é uma funcionalidade avançada que requer configuração específica na conta Twilio</li>
        </ul>
      </div>
    </div>
  );
}
