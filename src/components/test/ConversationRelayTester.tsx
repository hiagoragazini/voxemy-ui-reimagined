import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2 } from "lucide-react";
import { useVoiceCall } from "@/hooks/use-voice-call";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export function ConversationRelayTester() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [agentId, setAgentId] = useState("");
  const [assistantId, setAssistantId] = useState("");
  const [isTestMode, setIsTestMode] = useState(true);
  const [message, setMessage] = useState("Olá! Aqui é a Voxemy via Vapi AI. Como posso te ajudar hoje?");
  
  const { makeCall, isLoading, error, callDetails } = useVoiceCall();

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
    
    if (isTestMode) {
      toast.success("Modo de teste: Chamada simulada com sucesso!");
      return;
    }
    
    try {
      toast.info("Iniciando chamada via Vapi AI...");
      
      await makeCall({ 
        phoneNumber,
        agentId: agentId || '',
        message,
        assistantId: assistantId || undefined
      });
    } catch (err) {
      console.error("Erro ao iniciar chamada:", err);
      toast.error("Falha ao iniciar a chamada");
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div>
        <h2 className="text-lg font-medium mb-4">Teste com Vapi AI</h2>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone-number">Número de telefone</Label>
            <Input
              id="phone-number"
              value={phoneNumber}
              onChange={handlePhoneChange}
              placeholder="Ex: 11999887766 (apenas números)"
              type="tel"
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="assistant-id">Assistant ID Vapi (opcional)</Label>
            <Input
              id="assistant-id"
              value={assistantId}
              onChange={(e) => setAssistantId(e.target.value)}
              placeholder="ID do assistant configurado na Vapi"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Mensagem inicial</Label>
            <Input
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Mensagem que o assistente irá falar"
              disabled={isLoading}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="test-mode"
              checked={isTestMode}
              onCheckedChange={setIsTestMode}
              disabled={isLoading}
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
          
          {callDetails && (
            <div className="flex flex-col space-y-2 items-center justify-center p-4 bg-green-50 rounded-lg border border-green-200">
              <div className="text-sm">
                <span className="font-medium">Chamada iniciada com sucesso!</span>
              </div>
              <div className="text-sm">
                <span className="font-medium">ID da chamada:</span> {callDetails.callId}
              </div>
            </div>
          )}
          
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
                Iniciar Chamada com Vapi AI
              </>
            )}
          </Button>
        </div>
      </div>
      
      <div className="p-4 bg-green-50 border border-green-100 rounded">
        <h3 className="text-sm font-medium text-green-700 mb-2">Vapi AI Ativado:</h3>
        <ul className="text-sm text-green-600 space-y-1 list-disc pl-5">
          <li>Voz natural ElevenLabs em português brasileiro</li>
          <li>Transcrição precisa com OpenAI</li>
          <li>Conversas mais fluidas e naturais</li>
          <li>Integração simplificada sem WebSockets complexos</li>
          <li>Melhor qualidade de áudio para telefonia</li>
        </ul>
      </div>
    </div>
  );
}
