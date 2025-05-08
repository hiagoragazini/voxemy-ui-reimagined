
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CampaignCallTesterProps {
  campaignId?: string;
  agentId?: string;
  agentName?: string;
  onClose?: () => void;
}

export function CampaignCallTester({
  campaignId,
  agentId,
  agentName = "Agente",
  onClose
}: CampaignCallTesterProps) {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  
  const handleMakeCall = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error("Por favor, insira um número de telefone válido");
      return;
    }
    
    setIsLoading(true);
    setCallStatus("Iniciando chamada...");
    
    try {
      const callbackUrl = window.location.origin + '/api/call-status';
      
      const { data, error } = await supabase.functions.invoke('make-call', {
        body: { 
          phoneNumber, 
          callbackUrl,
          agentId,
          campaignId,
          twimlInstructions: `
            <Response>
              <Say language="pt-BR">Olá, aqui é ${agentName}. Esta é uma chamada de teste da nossa plataforma.</Say>
              <Pause length="1"/>
              <Say language="pt-BR">Obrigado por testar nosso sistema de chamadas automáticas.</Say>
            </Response>
          `
        }
      });

      if (error) {
        throw new Error(error.message);
      }
      
      if (!data.success) {
        throw new Error(data.error || "Falha ao fazer chamada");
      }

      setCallStatus(`Chamada iniciada com sucesso! ID: ${data.callSid}`);
      toast.success("Chamada iniciada com sucesso!");
    } catch (err: any) {
      console.error('Erro ao fazer chamada:', err);
      setCallStatus(`Erro: ${err.message}`);
      toast.error("Erro ao fazer chamada: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">Testar chamada: {agentName}</h3>
        <p className="text-sm text-muted-foreground">
          Faça uma chamada de teste para verificar a configuração do agente
        </p>
      </div>

      <div className="space-y-3">
        <div className="space-y-1">
          <label htmlFor="phoneNumber" className="text-sm font-medium">
            Número de telefone
          </label>
          <Input
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="(00) 00000-0000"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            Formato: DDD + número, exemplo: 11999887766
          </p>
        </div>
        
        <Button 
          onClick={handleMakeCall}
          disabled={isLoading || !phoneNumber}
          className="flex items-center gap-2 w-full bg-violet-600 hover:bg-violet-700"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
          <span>Fazer Chamada de Teste</span>
        </Button>
        
        {callStatus && (
          <div className={`p-2 rounded-md text-sm ${callStatus.includes('Erro') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
            {callStatus}
          </div>
        )}
      </div>

      {onClose && (
        <Button 
          onClick={onClose}
          variant="ghost"
          className="w-full"
        >
          Fechar
        </Button>
      )}
    </Card>
  );
}
