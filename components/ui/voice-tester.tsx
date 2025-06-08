
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2, Volume2, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";

interface VoiceTesterProps {
  agentName?: string;
  agentId?: string;
  voiceId?: string;
  defaultText?: string;
  testNumber?: string;
  onClose?: () => void;
}

export function VoiceTester({
  agentName,
  agentId,
  voiceId,
  defaultText = "Olá, eu sou um agente de voz alimentado por inteligência artificial usando vozes nativas da Twilio. Como posso ajudar você hoje?",
  testNumber,
  onClose
}: VoiceTesterProps) {
  const [text, setText] = useState(defaultText);
  const [phoneNumber, setPhoneNumber] = useState(testNumber || "");
  const [isLoading, setIsLoading] = useState(false);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Keep only numbers
    const value = e.target.value.replace(/\D/g, "");
    setPhoneNumber(value);
  };

  const handleMakeCall = async () => {
    if (!phoneNumber) {
      toast.error("Por favor, informe um número de telefone para teste");
      return;
    }

    if (!text.trim()) {
      toast.error("Por favor, insira um texto para testar");
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
      
      console.log("Dados da chamada:", {
        text,
        phoneNumber,
        agentId: agentId || 'voice-tester'
      });
      
      // Usar supabase.functions.invoke ao invés de fetch direto
      const { data, error } = await supabase.functions.invoke('tts-twillio-handler', {
        body: {
          text: text,
          phoneNumber: phoneNumber,
          agentId: agentId || 'voice-tester',
          callSid: `test-${Date.now()}`,
        }
      });

      if (error) {
        console.error("Erro na função Supabase:", error);
        throw new Error(error.message || "Erro na função do Supabase");
      }

      if (data && data.success) {
        toast.success(`Chamada iniciada com sucesso! ID: ${data.call_sid}`);
        console.log("Sucesso na chamada:", data);
      } else {
        throw new Error(data?.message || "Erro desconhecido na resposta");
      }
    } catch (err: any) {
      console.error("Erro ao fazer chamada:", err);
      toast.error(`Erro ao iniciar chamada: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-4 space-y-4 bg-white rounded-lg shadow">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">
          {agentName ? `Testar voz: ${agentName}` : "Testar voz do agente"}
        </h3>
        <p className="text-sm text-muted-foreground">
          Teste a voz nativa da Twilio fazendo uma chamada real
        </p>
      </div>

      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
        <h4 className="font-medium text-green-800 mb-1">✅ Vozes Nativas Twilio</h4>
        <p className="text-sm text-green-700">
          Sistema corrigido - usando pt-BR-FranciscaNeural (qualidade ElevenLabs via Twilio)
        </p>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Digite o texto para o agente falar..."
        className="min-h-[100px]"
      />

      <div className="space-y-2">
        <Label htmlFor="phone-number">Número de telefone para teste</Label>
        <Input
          id="phone-number"
          type="tel"
          value={phoneNumber}
          onChange={handlePhoneChange}
          placeholder="Digite um número para teste (ex: 11987654321)"
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          Digite apenas números, incluindo DDD
        </p>
      </div>

      <Button 
        onClick={handleMakeCall}
        disabled={isLoading || !text || !phoneNumber}
        className="w-full flex items-center gap-2 bg-green-600 hover:bg-green-700"
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

      <div className="flex justify-between items-center">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setShowTroubleshooting(!showTroubleshooting)}
          className="flex items-center gap-1 text-xs"
        >
          <HelpCircle className="h-3 w-3" />
          {showTroubleshooting ? "Ocultar dicas" : "Problemas na chamada?"}
        </Button>
      </div>

      {showTroubleshooting && (
        <div className="space-y-2 text-xs text-muted-foreground mt-2 p-3 bg-gray-50 rounded-md">
          <p className="font-medium text-black">Solução de problemas:</p>
          <ul className="text-left pl-4 space-y-1.5">
            <li className="flex items-start gap-1.5">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Verifique se as credenciais Twilio estão configuradas no Supabase</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Certifique-se de que o número inclui DDD (ex: 11999887766)</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>Verifique os logs do Supabase Edge Functions para detalhes do erro</span>
            </li>
            <li className="flex items-start gap-1.5">
              <span className="text-green-600 mt-0.5">✓</span>
              <span>O sistema usa vozes nativas da Twilio (qualidade ElevenLabs)</span>
            </li>
          </ul>
        </div>
      )}

      {onClose && (
        <Button 
          onClick={onClose}
          variant="ghost"
          className="w-full"
        >
          Fechar
        </Button>
      )}
    </div>
  );
}
