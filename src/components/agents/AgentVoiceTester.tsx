import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Volume2, Phone } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface AgentVoiceTesterProps {
  agentName?: string;
  agentId?: string;
  voiceId?: string;
  onClose?: () => void;
}

export function AgentVoiceTester({
  agentName = "Agente",
  agentId,
  voiceId,
  onClose
}: AgentVoiceTesterProps) {
  const [text, setText] = useState(`Olá, eu sou ${agentName}, um assistente de voz. Como posso ajudar você hoje?`);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const handleTestCall = async () => {
    if (!text.trim()) {
      toast.error("Por favor, insira um texto para testar");
      return;
    }

    if (!phoneNumber.trim()) {
      toast.error("Por favor, insira um número de telefone para teste");
      return;
    }

    // Validar formato do telefone
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Número de telefone inválido. Use apenas números, incluindo DDD (ex: 11999887766)");
      return;
    }

    try {
      setIsLoading(true);
      toast.info("Iniciando chamada com voz nativa Twilio...");
      
      console.log("Fazendo chamada com voz nativa Twilio:");
      console.log("- Agente:", agentName);
      console.log("- Texto:", text);
      console.log("- Telefone:", phoneNumber);
      
      // Usar supabase.functions.invoke ao invés de fetch direto
      const { data, error } = await supabase.functions.invoke('tts-twillio-handler', {
        body: {
          text: text,
          phoneNumber: phoneNumber,
          agentId: agentId || 'test-agent',
          callSid: `test-${Date.now()}`,
        }
      });

      if (error) {
        console.error("Erro na função Supabase:", error);
        throw new Error(error.message || "Erro na função do Supabase");
      }

      if (data && data.success) {
        toast.success(`Chamada iniciada com sucesso! ID: ${data.call_sid}`);
        console.log("Chamada iniciada:", data);
      } else {
        throw new Error(data?.message || "Erro desconhecido na chamada");
      }
    } catch (err: any) {
      console.error("Erro ao iniciar chamada:", err);
      toast.error(`Erro ao iniciar chamada: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only numbers
    const value = e.target.value.replace(/\D/g, "");
    setPhoneNumber(value);
  };
  
  return (
    <Card className="p-6 space-y-6 rounded-xl shadow-apple">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Testar voz: {agentName}</h3>
        <p className="text-sm text-muted-foreground">
          Digite um texto e número para testar a voz nativa da Twilio
        </p>
        
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Badge className="bg-green-100 text-green-800">✅ Voz Nativa Twilio</Badge>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Usando pt-BR-FranciscaNeural (voz brasileira nativa com qualidade ElevenLabs)
          </p>
        </div>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Digite o texto para o agente falar..."
        className="min-h-[120px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
      />

      <div className="space-y-2">
        <Label htmlFor="phone-number">Número de telefone para teste</Label>
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

      <div className="flex flex-col space-y-4">
        <Button 
          onClick={handleTestCall}
          disabled={isLoading || !text || !phoneNumber}
          className="flex items-center gap-2 bg-green-600 hover:bg-green-700 h-11 font-medium"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
          <span>
            {isLoading ? "Iniciando chamada..." : "Fazer Chamada com Voz Nativa"}
          </span>
        </Button>
      </div>

      {onClose && (
        <Button 
          onClick={onClose}
          variant="ghost"
          className="w-full text-gray-600 hover:text-gray-800 hover:bg-gray-100"
        >
          Fechar
        </Button>
      )}
      
      <div className="mt-6 text-xs text-muted-foreground border-t pt-4 space-y-2">
        <p className="font-medium text-gray-700">O sistema de chamadas Voxemy usa:</p>
        <ul className="list-disc pl-5 space-y-1 text-gray-600">
          <li>Twilio para telefonia</li>
          <li>Vozes nativas brasileiras da Twilio (qualidade ElevenLabs)</li>
          <li>ConversationRelay Protocol corrigido</li>
          <li>IA para processamento de linguagem natural</li>
        </ul>
      </div>
    </Card>
  );
}
