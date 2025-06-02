
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Phone, Volume2, Loader2, MessageSquare, Settings } from "lucide-react";
import { useVoiceCall } from "@/hooks/use-voice-call";
import { useConversationRelay } from "@/hooks/use-conversation-relay";
import { AudioPlayer } from "@/components/ui/AudioPlayer";
import { toast } from "sonner";

interface AdvancedAgentTesterProps {
  agentId: string;
  agentName: string;
  voiceId?: string;
  onClose?: () => void;
}

export function AdvancedAgentTester({
  agentId,
  agentName,
  voiceId,
  onClose
}: AdvancedAgentTesterProps) {
  // Voice test states
  const [voiceTestText, setVoiceTestText] = useState(
    `Olá, eu sou ${agentName}. Este é um teste de voz para verificar como eu soaria em uma chamada real.`
  );
  const [audioContent, setAudioContent] = useState<string | null>(null);
  
  // Call test states
  const [phoneNumber, setPhoneNumber] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [conversationScenario, setConversationScenario] = useState("");

  const { isLoading: voiceLoading, textToSpeech, playAudio, stopAudio, isPlaying } = useVoiceCall();
  const { makeCall, isLoading: callLoading, callStatus, transcript } = useConversationRelay();

  const handleVoiceTest = async () => {
    if (!voiceTestText.trim()) {
      toast.error("Digite um texto para testar a voz");
      return;
    }

    try {
      if (isPlaying) {
        stopAudio();
        return;
      }

      const audioData = await textToSpeech({
        text: voiceTestText,
        voiceId: voiceId || "FGY2WhTYpPnrIDTdsKH5",
        model: "eleven_multilingual_v2",
        stability: 0.5,
        similarity_boost: 0.5,
        style: 0.0
      });

      if (audioData) {
        setAudioContent(audioData);
        playAudio(audioData);
        toast.success("Teste de voz executado com sucesso!");
      }
    } catch (error) {
      console.error("Erro no teste de voz:", error);
      toast.error("Erro ao testar a voz do agente");
    }
  };

  const handleCallTest = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Digite um número de telefone para testar");
      return;
    }

    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Número de telefone deve ter pelo menos 10 dígitos");
      return;
    }

    try {
      const result = await makeCall({
        phoneNumber: cleanPhone,
        agentId,
        testMode: true
      });

      if (result) {
        toast.success(`Chamada de teste iniciada para ${cleanPhone}`);
      }
    } catch (error) {
      console.error("Erro na chamada de teste:", error);
      toast.error("Erro ao iniciar chamada de teste");
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Teste Avançado: {agentName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="voice" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="voice" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              Voz
            </TabsTrigger>
            <TabsTrigger value="call" className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              Chamada
            </TabsTrigger>
            <TabsTrigger value="conversation" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Conversa
            </TabsTrigger>
          </TabsList>

          <TabsContent value="voice" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="voice-text">Texto para Teste de Voz</Label>
              <Textarea
                id="voice-text"
                value={voiceTestText}
                onChange={(e) => setVoiceTestText(e.target.value)}
                placeholder="Digite o texto que o agente deve falar..."
                rows={4}
              />
            </div>

            <Button
              onClick={handleVoiceTest}
              disabled={voiceLoading || !voiceTestText.trim()}
              className="w-full"
            >
              {voiceLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Volume2 className="h-4 w-4 mr-2" />
              )}
              {isPlaying ? "Parar Áudio" : "Testar Voz"}
            </Button>

            {audioContent && (
              <div className="p-4 bg-slate-50 rounded-lg">
                <AudioPlayer audioData={audioContent} isLoading={voiceLoading} />
              </div>
            )}
          </TabsContent>

          <TabsContent value="call" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="phone-number">Número de Telefone</Label>
              <Input
                id="phone-number"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-message">Mensagem Personalizada (Opcional)</Label>
              <Textarea
                id="custom-message"
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Digite uma mensagem específica para este teste..."
                rows={3}
              />
            </div>

            <Button
              onClick={handleCallTest}
              disabled={callLoading || !phoneNumber.trim()}
              className="w-full"
            >
              {callLoading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Phone className="h-4 w-4 mr-2" />
              )}
              Fazer Chamada de Teste
            </Button>

            {callStatus && (
              <div className="p-3 bg-blue-50 rounded-lg">
                <p className="text-sm font-medium">Status da Chamada: {callStatus}</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="conversation" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="scenario">Cenário de Conversa</Label>
              <Textarea
                id="scenario"
                value={conversationScenario}
                onChange={(e) => setConversationScenario(e.target.value)}
                placeholder="Descreva o cenário de conversa que você gostaria de testar..."
                rows={3}
              />
            </div>

            {transcript.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto p-3 border rounded-lg">
                <Label>Transcrição da Conversa</Label>
                {transcript.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded ${
                      item.role === "user" ? "bg-blue-50 ml-4" : "bg-gray-50 mr-4"
                    }`}
                  >
                    <div className="text-xs text-muted-foreground mb-1">
                      {item.role === "user" ? "Cliente" : "Agente"}
                    </div>
                    <p className="text-sm">{item.text}</p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>

        {onClose && (
          <div className="flex justify-end mt-6">
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
