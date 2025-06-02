
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Loader2, Volume2, Phone } from "lucide-react";
import { toast } from "sonner";
import { useVoiceCall } from "@/hooks/use-voice-call";
import { AudioPlayer } from "@/components/ui/AudioPlayer";

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
  const [audioContent, setAudioContent] = useState<string | null>(null);
  const { isLoading, textToSpeech, makeCall, playAudio, stopAudio, isPlaying } = useVoiceCall();
  
  // Use a voz Laura que tem boa qualidade para português
  const defaultVoiceId = "FGY2WhTYpPnrIDTdsKH5"; // Laura - melhor para português
  
  const handleTestVoice = async () => {
    if (!text.trim()) {
      toast.error("Por favor, insira um texto para testar");
      return;
    }

    try {
      if (isPlaying) {
        // If already playing, stop playback
        stopAudio();
        return;
      }
      
      console.log("Iniciando teste de voz para:", agentName);
      console.log("Usando voiceId:", voiceId || defaultVoiceId);
      console.log("Texto para falar:", text);
      
      // Usar sempre o modelo multilingual para português com configurações otimizadas
      const audioData = await textToSpeech({ 
        text, 
        voiceId: voiceId || defaultVoiceId,
        model: "eleven_multilingual_v2", // Modelo atualizado para melhor qualidade
        stability: 0.5,         // Configurações ajustadas
        similarity_boost: 0.5,  // para melhor performance em chamadas
        style: 0.0
      });
      
      if (audioData) {
        setAudioContent(audioData);
        playAudio(audioData);
        toast.success("Áudio gerado com sucesso!");
      } else {
        throw new Error("Não foi possível gerar áudio");
      }
    } catch (err: any) {
      console.error("Erro ao testar voz:", err);
      toast.error("Erro ao testar a voz do agente: " + err.message);
    }
  };
  
  const handleMakeCall = async () => {
    if (!agentId) {
      toast.error("ID do agente não disponível");
      return;
    }

    const phoneNumber = prompt("Digite o número de telefone para ligar (apenas números com DDD):");
    
    if (!phoneNumber) {
      toast.error("Número de telefone não fornecido");
      return;
    }
    
    // Validar formato do telefone
    const phoneRegex = /^\d{10,11}$/;
    if (!phoneRegex.test(phoneNumber)) {
      toast.error("Número de telefone inválido. Use apenas números, incluindo DDD (ex: 11999887766)");
      return;
    }
    
    try {
      toast.info(`Iniciando chamada para ${phoneNumber}...`);
      
      // Log detalhado para diagnóstico
      console.log("Usando voice ID do state:", voiceId);
      console.log("Iniciando chamada com voice ID:", voiceId || defaultVoiceId);
      console.log("Mensagem a ser enviada:", text);
      console.log("Número de telefone:", phoneNumber);
      console.log("Tipo de voiceId:", typeof voiceId);
      if (voiceId) console.log("Comprimento do voiceId:", voiceId.length);
      
      // Incluir todos os parâmetros para diagnóstico completo
      console.log("Parâmetros completos para makeCall:", {
        agentId,
        campaignId: "",
        phoneNumber,
        message: text,
        leadId: "",
        voiceId: voiceId || defaultVoiceId
      });
      
      const result = await makeCall({
        agentId,
        campaignId: "",
        phoneNumber,
        message: text,
        leadId: "",
        voiceId: voiceId || defaultVoiceId
      });
      
      if (result) {
        toast.success(`Chamada iniciada com sucesso! ID da chamada: ${result.callSid || result.call_sid}`);
      } else {
        toast.error("Erro ao iniciar chamada: Nenhuma resposta recebida");
      }
    } catch (err: any) {
      console.error("Erro ao iniciar chamada:", err);
      toast.error(`Erro ao iniciar chamada: ${err.message || "Falha inesperada"}`);
    }
  };
  
  return (
    <Card className="p-6 space-y-6 rounded-xl shadow-apple">
      <div className="space-y-2">
        <h3 className="text-xl font-semibold text-gray-900">Testar voz: {agentName}</h3>
        <p className="text-sm text-muted-foreground">
          Digite um texto para ouvir como a voz deste agente soa
        </p>
      </div>

      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Digite o texto para o agente falar..."
        className="min-h-[120px] resize-none border-gray-200 focus:border-blue-500 focus:ring-blue-500"
      />

      <div className="flex flex-col space-y-4">
        <Button 
          onClick={handleTestVoice}
          disabled={isLoading || !text}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 h-11 font-medium"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Volume2 className="h-4 w-4" />
          )}
          <span>{isPlaying ? "Parar Áudio" : "Testar Voz"}</span>
        </Button>
        
        {audioContent && (
          <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-100">
            <AudioPlayer 
              audioData={audioContent} 
              isLoading={isLoading} 
            />
          </div>
        )}

        <Button 
          onClick={handleMakeCall}
          variant="outline"
          className="flex items-center gap-2 h-11 border-blue-200 text-blue-700 hover:bg-blue-50 hover:border-blue-300"
          disabled={isLoading || !text}
        >
          <Phone className="h-4 w-4" />
          <span>Fazer ligação teste</span>
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
          <li>ElevenLabs para síntese de voz natural em português</li>
          <li>IA para processamento de linguagem natural</li>
        </ul>
      </div>
    </Card>
  );
}
