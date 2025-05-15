
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
  
  const { makeCall, textToSpeech, playAudio, isLoading } = useVoiceCall();
  
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
      return data;
    },
    enabled: !!agentId,
  });
  
  // Update selected voice when agent data is loaded or changed
  useEffect(() => {
    if (agentData?.voice_id) {
      setSelectedVoice(agentData.voice_id);
    } else if (agentVoiceId) {
      setSelectedVoice(agentVoiceId);
    }
  }, [agentData, agentVoiceId]);
  
  // Get best available voice ID
  const getVoiceId = () => {
    // Prioridade 1: Voz selecionada no componente
    if (selectedVoice) return selectedVoice;
    
    // Prioridade 2: Voz associada ao agente no banco de dados
    if (agentData?.voice_id) return agentData.voice_id;
    
    // Prioridade 3: Fallback para voz padrão em português
    return "FGY2WhTYpPnrIDTdsKH5"; // ID da voz Laura
  };

  const handleTestVoice = async () => {
    try {
      if (isPlaying) {
        // If already playing, stop playback
        if (audioContent) {
          setIsPlaying(false);
        }
        return;
      }
      
      setIsPlaying(true);
      
      const voiceId = getVoiceId();
      const testScript = `Olá ${testName || "cliente"}, aqui é ${agentName} da empresa. Como posso ajudar você hoje?`;
      
      // Generate the audio from text
      const audioData = await textToSpeech({
        text: testScript,
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
      if (!testPhone) {
        toast.warning("Por favor, insira um número de telefone para teste");
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
      
      await makeCall({
        agentId: agentId || '',
        campaignId: campaignId,
        phoneNumber: cleanPhone,
        message: `Olá ${testName || "cliente"}, aqui é ${agentName} da empresa. Como posso ajudar você hoje?`,
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
          <Label htmlFor="test-phone">Telefone para teste</Label>
          <Input 
            id="test-phone"
            value={testPhone}
            onChange={(e) => setTestPhone(e.target.value)}
            placeholder="DDD + número (ex: 11999887766)"
            type="tel"
          />
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
            disabled={isLoading || !testPhone}
          >
            <Phone className="mr-2 h-4 w-4" />
            Iniciar Chamada de Teste
          </Button>
        </div>
      </div>
    </div>
  );
}
