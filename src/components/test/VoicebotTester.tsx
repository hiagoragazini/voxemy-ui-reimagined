
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Phone, X, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { useVoicebot } from '@/hooks/use-voicebot';

interface VoicebotTesterProps {
  agentId?: string;
  agentName?: string;
  voiceId?: string;
}

export function VoicebotTester({
  agentId,
  agentName = "Assistente Virtual",
  voiceId
}: VoicebotTesterProps) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [message, setMessage] = useState(`Olá, sou ${agentName}. Como posso ajudar?`);
  const [showTranscription, setShowTranscription] = useState(false);
  
  const { 
    initiateCall, 
    terminateCall, 
    callStatus, 
    isProcessing,
    transcription 
  } = useVoicebot();
  
  const handleCall = async () => {
    try {
      if (!phoneNumber) {
        toast.error("Digite um número de telefone");
        return;
      }
      
      await initiateCall({
        phoneNumber,
        agentId,
        initialMessage: message,
        voiceId
      });
      
      toast.success("Chamada iniciada com sucesso!");
    } catch (err: any) {
      toast.error(`Erro: ${err.message}`);
    }
  };
  
  const handleTerminate = async () => {
    try {
      await terminateCall();
    } catch (err: any) {
      toast.error(`Erro ao encerrar: ${err.message}`);
    }
  };
  
  const isCallActive = callStatus.status === 'active' || callStatus.status === 'connecting';
  
  return (
    <Card className="p-4 space-y-4">
      <div>
        <h2 className="text-lg font-medium mb-4">Voicebot Full-Duplex com Arquitetura Própria</h2>
        
        <Alert className="mb-4 border-amber-300 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700">Configuração necessária</AlertTitle>
          <AlertDescription className="text-amber-600">
            Para utilizar esta funcionalidade, configure as variáveis de ambiente no Supabase:
            <ul className="list-disc list-inside mt-2">
              <li>MEDIA_SERVER_URL - URL do servidor FreeSWITCH/Asterisk</li>
              <li>SIP_TRUNK_GATEWAY - Configuração do gateway SIP</li>
              <li>OPENAI_API_KEY - Para processamento de linguagem</li>
              <li>ELEVENLABS_API_KEY - Para síntese de voz natural</li>
            </ul>
          </AlertDescription>
        </Alert>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Número de telefone</Label>
            <Input
              id="phone"
              placeholder="DDD + número (sem zero)"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isCallActive}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="message">Mensagem inicial</Label>
            <Textarea
              id="message"
              placeholder="Mensagem inicial que o agente irá falar"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isCallActive}
              rows={3}
            />
          </div>
          
          <div className="flex justify-between">
            <Button
              onClick={handleCall}
              disabled={isProcessing || isCallActive || !phoneNumber}
              className={isCallActive ? "bg-red-600 hover:bg-red-700" : ""}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processando...
                </>
              ) : isCallActive ? (
                <>
                  <X className="mr-2 h-4 w-4" />
                  Encerrar
                </>
              ) : (
                <>
                  <Phone className="mr-2 h-4 w-4" />
                  Iniciar Chamada
                </>
              )}
            </Button>
            
            {isCallActive && (
              <Button
                variant="outline"
                onClick={handleTerminate}
                disabled={isProcessing}
              >
                Encerrar chamada
              </Button>
            )}
          </div>
          
          {callStatus.status === 'active' && (
            <Alert className="bg-green-50 border-green-200">
              <AlertCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-700">Chamada ativa</AlertTitle>
              <AlertDescription className="text-green-600">
                ID da chamada: {callStatus.callId}
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-green-700" 
                  onClick={() => setShowTranscription(!showTranscription)}
                >
                  {showTranscription ? "Ocultar transcrição" : "Ver transcrição"}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {callStatus.status === 'completed' && (
            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertTitle className="text-blue-700">Chamada finalizada</AlertTitle>
              <AlertDescription className="text-blue-600">
                Duração: {callStatus.duration || 0} segundos
                <Button 
                  variant="link" 
                  className="p-0 h-auto text-blue-700" 
                  onClick={() => setShowTranscription(!showTranscription)}
                >
                  {showTranscription ? "Ocultar transcrição" : "Ver transcrição"}
                </Button>
              </AlertDescription>
            </Alert>
          )}
          
          {callStatus.status === 'failed' && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Erro na chamada</AlertTitle>
              <AlertDescription>
                {callStatus.error || "Erro desconhecido ao processar chamada"}
              </AlertDescription>
            </Alert>
          )}
          
          {showTranscription && transcription.length > 0 && (
            <div className="mt-4 p-3 bg-slate-50 rounded-md border border-slate-200 max-h-60 overflow-y-auto">
              <h3 className="font-medium mb-2">Transcrição da chamada:</h3>
              <div className="space-y-2">
                {transcription.map((line, index) => (
                  <div key={index} className="text-sm">
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
