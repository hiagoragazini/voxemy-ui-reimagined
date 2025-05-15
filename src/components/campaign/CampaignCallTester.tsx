
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Phone, Volume2, Check } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useVoiceCall } from "@/hooks/use-voice-call";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { VOICES } from "@/constants/voices";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface CampaignCallTesterProps {
  campaignId?: string; // Made optional
  agentId?: string;
  agentName?: string;
  agentVoiceId?: string; 
  phoneNumber?: string; // Made optional
  leadName?: string; // Made optional
  leadId?: string; // Made optional
  onClose?: () => void;
  onCallComplete?: () => void;
}

export function CampaignCallTester({
  campaignId = '', // Default empty string
  agentId,
  agentName = "Agente",
  agentVoiceId,
  phoneNumber = '', // Default empty string
  leadName = 'Teste', // Default value
  leadId = '', // Default empty string
  onClose,
  onCallComplete
}: CampaignCallTesterProps) {
  const [message, setMessage] = useState(
    `Olá, aqui é ${agentName}. Esta é uma chamada de teste da plataforma Voxemy. Obrigado por testar nosso sistema.`
  );
  const [audioContent, setAudioContent] = useState<string | null>(null);
  const [makingCall, setMakingCall] = useState(false);
  const { isLoading, textToSpeech, makeCall, playAudio } = useVoiceCall();
  
  // Buscar dados do agente se não temos o voiceId
  const { data: agentData, isLoading: loadingAgent } = useQuery({
    queryKey: ["agent-voice", agentId],
    queryFn: async () => {
      if (!agentId) return null;
      
      // Só buscar no Supabase se não tivermos o agentVoiceId
      if (agentVoiceId) return { voice_id: agentVoiceId };
      
      const { data, error } = await supabase
        .from("agents")
        .select("voice_id")
        .eq("id", agentId)
        .single();
        
      if (error) throw error;
      return data;
    },
    enabled: !!agentId && !agentVoiceId
  });

  // Determinar qual voiceId usar
  const getVoiceId = () => {
    // Prioridade 1: O voiceId fornecido diretamente como prop
    if (agentVoiceId) return agentVoiceId;
    
    // Prioridade 2: O voiceId obtido da consulta ao banco de dados
    if (agentData?.voice_id) return agentData.voice_id;
    
    // Prioridade 3: Fallback para voz padrão em português
    // Usando formato compatível com a constante VOICES
    return "TxGEqnHWrfWFTfGW9XjX"; // ID da voz Laura
  };

  const handleTestVoice = async () => {
    if (!message.trim()) {
      toast.error("Por favor, digite uma mensagem para testar");
      return;
    }
    
    try {
      // Log detalhado para diagnóstico
      console.log("[CampaignCallTester] Iniciando teste de voz");
      console.log("[CampaignCallTester] Mensagem:", message);
      console.log("[CampaignCallTester] Voice ID:", getVoiceId());
      
      // Usar configurações otimizadas para português
      const audioData = await textToSpeech({
        text: message,
        voiceId: getVoiceId(),
        model: "eleven_multilingual_v1", // Forçando modelo multilíngue que suporta português
        stability: 0.7,
        similarity_boost: 0.8,
        style: 0.4
      });
      
      if (audioData) {
        // Log do resultado
        console.log("[CampaignCallTester] Áudio gerado com sucesso");
        
        setAudioContent(audioData);
        playAudio(audioData);
      } else {
        console.error("[CampaignCallTester] Falha ao gerar áudio");
        toast.error("Não foi possível gerar áudio");
      }
    } catch (err) {
      console.error("[CampaignCallTester] Erro ao testar voz:", err);
      toast.error("Erro ao testar a voz");
    }
  };

  const handleMakeCall = async () => {
    if (!phoneNumber) {
      toast.error("Número de telefone inválido");
      return;
    }
    
    if (!message.trim()) {
      toast.error("Por favor, digite uma mensagem para a chamada");
      return;
    }
    
    setMakingCall(true);
    
    try {
      // Log detalhado para diagnóstico
      console.log("[CampaignCallTester] Iniciando chamada de teste");
      console.log("[CampaignCallTester] Telefone:", phoneNumber);
      console.log("[CampaignCallTester] Mensagem:", message);
      console.log("[CampaignCallTester] AgentId:", agentId);
      console.log("[CampaignCallTester] Voice ID:", getVoiceId());
      
      // Configurando URL de callback para o registro de status da chamada
      const origin = window.location.origin;
      const callbackUrl = `${origin}/api/call-status`;
      
      const result = await makeCall({
        phoneNumber,
        message,
        agentId,
        campaignId,
        twimlInstructions: null,
        voiceId: getVoiceId() // Enviar a ID da voz específica do agente
      });
      
      if (result) {
        console.log("[CampaignCallTester] Chamada iniciada com sucesso:", result);
        toast.success("Chamada iniciada com sucesso!");
        
        if (onCallComplete) {
          onCallComplete();
        }
        
        if (onClose) {
          onClose();
        }
      }
    } catch (err) {
      console.error("[CampaignCallTester] Erro ao fazer chamada:", err);
      toast.error("Erro ao iniciar chamada");
    } finally {
      setMakingCall(false);
    }
  };

  return (
    <Card className="p-4 space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Testar chamada</h3>
          <p className="text-sm text-muted-foreground">
            {leadName ? leadName : 'Teste'} • {phoneNumber ? phoneNumber : 'Informe um número'}
          </p>
        </div>
      </div>
      
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Digite a mensagem que será dita na chamada..."
        className="min-h-[100px]"
      />

      <div className="space-y-3">
        {/* Mostrar botão para testar a voz */}
        <Button 
          onClick={handleTestVoice}
          disabled={isLoading || !message.trim()}
          variant="outline"
          className="w-full"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Volume2 className="h-4 w-4 mr-2" />
          )}
          Testar voz
        </Button>
        
        {/* Mostrar player de áudio se tiver conteúdo */}
        {audioContent && (
          <div className="flex justify-center p-2 bg-slate-50 rounded-md">
            <AudioPlayer audioData={audioContent} isLoading={false} />
          </div>
        )}
        
        {/* Botão para fazer a chamada */}
        <Button 
          onClick={handleMakeCall}
          disabled={makingCall || !message.trim() || !phoneNumber}
          className="w-full bg-blue-800 hover:bg-blue-900"
        >
          {makingCall ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Phone className="h-4 w-4 mr-2" />
          )}
          Fazer chamada
        </Button>
        
        {/* Botão para cancelar/fechar */}
        {onClose && !makingCall && (
          <Button 
            onClick={onClose}
            variant="ghost"
            className="w-full"
          >
            <Check className="h-4 w-4 mr-2" />
            Concluído
          </Button>
        )}
      </div>
    </Card>
  );
}
