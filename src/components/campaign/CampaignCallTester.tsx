
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Play } from "lucide-react";
import { toast } from "sonner";
import { useVoiceCall } from "@/hooks/use-voice-call";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Textarea } from "@/components/ui/textarea";

interface CampaignCallTesterProps {
  campaignId?: string;
  agentId?: string;
  agentName?: string;
  assistantId?: string;
  phoneNumber?: string;
  leadName?: string;
  leadId?: string;
  onClose?: () => void;
  onCallComplete?: () => void;
}

export function CampaignCallTester({
  campaignId = '',
  agentId,
  agentName = "Agente",
  assistantId,
  phoneNumber = '',
  leadName = 'Teste',
  leadId = '',
  onClose,
  onCallComplete
}: CampaignCallTesterProps) {
  const [testPhone, setTestPhone] = useState(phoneNumber);
  const [testName, setTestName] = useState(leadName);
  const [phoneValid, setPhoneValid] = useState(true);
  const [testMessage, setTestMessage] = useState<string>("");
  const [selectedAssistantId, setSelectedAssistantId] = useState(assistantId || "");
  
  const { makeCall, isLoading } = useVoiceCall();
  
  // Fetch agent data if agentId is provided
  const { data: agentData } = useQuery({
    queryKey: ['agent', agentId],
    queryFn: async () => {
      if (!agentId) return null;
      
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('id', agentId)
        .single();
        
      if (error) throw error;
      
      console.log("Agent data loaded:", data);
      return data;
    },
    enabled: !!agentId,
  });

  // Update selected assistant when agent data is loaded or changed
  useEffect(() => {
    if (assistantId) {
      setSelectedAssistantId(assistantId);
      console.log("Assistant ID from props:", assistantId);
    }
  }, [assistantId]);
  
  // Validate phone number when it changes
  useEffect(() => {
    validatePhone(testPhone);
  }, [testPhone]);
  
  // Preparar a mensagem de teste padrão
  useEffect(() => {
    const defaultMessage = `Olá ${testName || "cliente"}, aqui é ${agentName} da Voxemy via Vapi AI. Como posso ajudar você hoje?`;
    setTestMessage(defaultMessage);
    console.log("Mensagem de teste padrão definida:", defaultMessage);
  }, [testName, agentName]);
  
  // Validate phone number format
  const validatePhone = (phone: string) => {
    // Limpa o número para conter apenas dígitos
    const cleanedPhone = phone.replace(/\D/g, '');
    
    // Verifica se tem pelo menos 10 dígitos (DDD + número)
    const isValid = cleanedPhone.length >= 10;
    setPhoneValid(isValid);
    return isValid;
  };

  const handleTestCall = async () => {
    try {
      if (!validatePhone(testPhone)) {
        toast.warning("Por favor, insira um número de telefone válido (pelo menos 10 dígitos)");
        return;
      }
      
      if (!testMessage.trim()) {
        toast.warning("Por favor, insira uma mensagem para a chamada");
        return;
      }
      
      // Confirma se o número está no formato correto (apenas dígitos)
      const cleanPhone = testPhone.replace(/\D/g, '');
      
      if (cleanPhone.length < 10) {
        toast.warning("Número de telefone inválido. Por favor, verifique e tente novamente.");
        return;
      }
      
      toast.info("Iniciando chamada de teste via Vapi AI...");
      
      console.log("Iniciando chamada Vapi com assistantId:", selectedAssistantId);
      console.log("Mensagem a ser enviada:", testMessage);
      console.log("Número de telefone:", cleanPhone);
      
      const result = await makeCall({
        agentId: agentId || '',
        campaignId: campaignId,
        phoneNumber: cleanPhone,
        message: testMessage,
        leadId: leadId,
        assistantId: selectedAssistantId
      });
      
      if (result && result.success) {
        toast.success(`Chamada Vapi AI iniciada com sucesso! ID: ${result.callId}`);
      } else {
        toast.error("Erro ao iniciar chamada: Nenhuma resposta recebida");
      }
      
      if (onCallComplete) {
        onCallComplete();
      }
    } catch (err: any) {
      console.error("Erro na chamada de teste:", err);
      toast.error(`Erro ao realizar chamada: ${err.message}`);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTestPhone(value);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-semibold text-center">
          Teste de Chamada Vapi AI
        </h3>
        <p className="text-sm text-center text-muted-foreground mb-2">
          Teste uma chamada do agente {agentName} via Vapi AI
        </p>
      </div>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="test-name">Nome para teste</Label>
          <Input 
            id="test-name"
            value={testName}
            onChange={(e) => setTestName(e.target.value)}
            placeholder="Nome do cliente para teste"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="assistant-id">Assistant ID Vapi</Label>
          <Input 
            id="assistant-id"
            value={selectedAssistantId}
            onChange={(e) => setSelectedAssistantId(e.target.value)}
            placeholder="ID do assistant configurado na Vapi"
          />
          <p className="text-xs text-muted-foreground">
            Configure este ID na plataforma Vapi para personalizar o comportamento do agente
          </p>
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="test-message">Mensagem do agente</Label>
          <Textarea
            id="test-message"
            value={testMessage}
            onChange={(e) => setTestMessage(e.target.value)}
            placeholder="Digite a mensagem que o agente deve falar"
            rows={3}
            className="resize-none"
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="test-phone" className={!phoneValid ? "text-red-500" : ""}>
            Telefone para teste {!phoneValid && "(Formato inválido)"}
          </Label>
          <Input 
            id="test-phone"
            value={testPhone}
            onChange={handlePhoneChange}
            placeholder="DDD + número (ex: 11999887766)"
            type="tel"
            className={!phoneValid ? "border-red-500" : ""}
          />
          {!phoneValid && (
            <p className="text-xs text-red-500 mt-1">
              Digite um número válido com DDD + número (mín. 10 dígitos)
            </p>
          )}
        </div>
        
        <div className="space-y-4">
          <Button 
            onClick={handleTestCall} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading || !testPhone || !phoneValid || !testMessage.trim()}
          >
            <Phone className="mr-2 h-4 w-4" />
            Iniciar Chamada de Teste (Vapi AI)
          </Button>
        </div>
      </div>
      
      <div className="mt-2 text-xs text-muted-foreground border-t pt-2">
        <p>O sistema Voxemy agora usa Vapi AI com:</p>
        <ul className="list-disc pl-5 mt-1">
          <li>Voz natural ElevenLabs em português brasileiro</li>
          <li>Transcrição precisa via OpenAI</li>
          <li>Conversas mais fluidas e naturais</li>
          <li>Melhor qualidade de áudio para telefonia</li>
        </ul>
      </div>
    </div>
  );
}
