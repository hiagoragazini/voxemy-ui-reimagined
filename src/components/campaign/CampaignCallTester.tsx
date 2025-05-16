import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Play, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { useVoiceCall } from "@/hooks/use-voice-call";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CampaignCallTesterProps {
  campaignId?: string;
  agentId?: string;
  agentName?: string;
  agentVoiceId?: string; 
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
  agentVoiceId,
  phoneNumber = '',
  leadName = 'Teste',
  leadId = '',
  onClose,
  onCallComplete
}: CampaignCallTesterProps) {
  const [testPhone, setTestPhone] = useState(phoneNumber);
  const [testName, setTestName] = useState(leadName);
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(agentVoiceId || "");
  const [audioContent, setAudioContent] = useState<string | null>(null);
  const [phoneValid, setPhoneValid] = useState(true);
  const [testMessage, setTestMessage] = useState<string>("");
  
  const { makeCall, textToSpeech, playAudio, isLoading, stopAudio } = useVoiceCall();
  
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

  // Update selected voice when agent data is loaded or changed
  useEffect(() => {
    if (agentData?.voice_id) {
      setSelectedVoice(agentData.voice_id);
      console.log("Voice ID loaded from agent data:", agentData.voice_id);
    } else if (agentVoiceId) {
      setSelectedVoice(agentVoiceId);
      console.log("Voice ID from props:", agentVoiceId);
    }
  }, [agentData, agentVoiceId]);
  
  // Validate phone number when it changes
  useEffect(() => {
    validatePhone(testPhone);
  }, [testPhone]);
  
  // Preparar a mensagem de teste
  useEffect(() => {
    const message = `Olá ${testName || "cliente"}, aqui é ${agentName} da empresa. Como posso ajudar você hoje?`;
    setTestMessage(message);
    console.log("Mensagem de teste atualizada:", message);
  }, [testName, agentName]);
  
  // Get best available voice ID
  const getVoiceId = () => {
    // Prioridade 1: Voz selecionada no componente
    if (selectedVoice) {
      console.log("Usando voice ID do state:", selectedVoice);
      return selectedVoice;
    }
    
    // Prioridade 2: Voz associada ao agente no banco de dados
    if (agentData?.voice_id) {
      console.log("Usando voice ID do banco de dados:", agentData.voice_id);
      return agentData.voice_id;
    }
    
    // Prioridade 3: Fallback para voz padrão em português
    console.log("Usando voice ID padrão (Laura)");
    return "FGY2WhTYpPnrIDTdsKH5"; // ID da voz Laura
  };

  // Validate phone number format
  const validatePhone = (phone: string) => {
    // Limpa o número para conter apenas dígitos
    const cleanedPhone = phone.replace(/\D/g, '');
    
    // Verifica se tem pelo menos 10 dígitos (DDD + número)
    const isValid = cleanedPhone.length >= 10;
    setPhoneValid(isValid);
    return isValid;
  };

  // Format phone number for display
  const formatPhoneForDisplay = (phone: string) => {
    // Remove tudo que não for número
    const cleaned = phone.replace(/\D/g, '');
    
    // Se tiver menos de 10 dígitos, não formata
    if (cleaned.length < 10) return phone;
    
    // Formata como (XX) XXXXX-XXXX ou equivalente internacional
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6)}`;
    } 
    
    // Se for número internacional ou outro formato, apenas retorna como está
    return phone;
  };

  const handleTestVoice = async () => {
    try {
      if (isPlaying) {
        // If already playing, stop playback
        stopAudio();
        setIsPlaying(false);
        return;
      }
      
      setIsPlaying(true);
      
      const voiceId = getVoiceId();
      console.log("Testando voz com voice ID:", voiceId);
      console.log("Texto a ser falado:", testMessage);
      
      // Generate the audio from text
      const audioData = await textToSpeech({
        text: testMessage,
        voiceId: voiceId
      });
      
      if (audioData) {
        setAudioContent(audioData);
        // Play the audio
        playAudio(audioData);
        toast.success("Áudio de teste reproduzido com sucesso!");
      } else {
        throw new Error("Falha ao gerar áudio");
      }
    } catch (err: any) {
      console.error("Erro no teste de voz:", err);
      toast.error(`Erro ao testar voz: ${err.message}`);
    } finally {
      setIsPlaying(false);
    }
  };

  const handleTestCall = async () => {
    try {
      if (!validatePhone(testPhone)) {
        toast.warning("Por favor, insira um número de telefone válido (pelo menos 10 dígitos)");
        return;
      }
      
      // Confirma se o número está no formato correto (apenas dígitos)
      const cleanPhone = testPhone.replace(/\D/g, '');
      
      if (cleanPhone.length < 10) {
        toast.warning("Número de telefone inválido. Por favor, verifique e tente novamente.");
        return;
      }
      
      toast.info("Iniciando chamada de teste...");
      
      const voiceId = getVoiceId();
      console.log("Iniciando chamada com voice ID:", voiceId);
      console.log("Mensagem a ser enviada:", testMessage);
      console.log("Número de telefone:", cleanPhone);
      
      // Add additional debug information
      console.log("Tipo de voiceId:", typeof voiceId);
      console.log("Comprimento do voiceId:", voiceId ? voiceId.length : "undefined/null");
      console.log("Parâmetros completos para makeCall:", {
        agentId,
        campaignId,
        phoneNumber: cleanPhone,
        message: testMessage,
        leadId,
        voiceId
      });
      
      await makeCall({
        agentId: agentId || '',
        campaignId: campaignId,
        phoneNumber: cleanPhone,
        message: testMessage,
        leadId: leadId,
        voiceId: voiceId
      });
      
      toast.success("Chamada de teste iniciada com sucesso!");
      
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
          Teste de Chamada
        </h3>
        <p className="text-sm text-center text-muted-foreground mb-2">
          Teste a voz do agente {agentName} ou inicie uma chamada de teste
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
          <Label htmlFor="test-phone" className={!phoneValid ? "text-red-500" : ""}>
            Telefone para teste {!phoneValid && "(Formato inválido)"}
          </Label>
          <Input 
            id="test-phone"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
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
            onClick={handleTestVoice} 
            className="w-full"
            disabled={isLoading}
            variant={isPlaying ? "secondary" : "default"}
          >
            {isPlaying ? (
              <>
                <StopCircle className="mr-2 h-4 w-4" />
                Parar Áudio
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Testar Voz do Agente
              </>
            )}
          </Button>
          
          {audioContent && !isPlaying && (
            <div className="mb-2">
              <AudioPlayer audioData={audioContent} />
            </div>
          )}
          
          <Button 
            onClick={handleTestCall} 
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={isLoading || !testPhone || !phoneValid}
          >
            <Phone className="mr-2 h-4 w-4" />
            Iniciar Chamada de Teste
          </Button>
        </div>
      </div>
    </div>
  );
}
