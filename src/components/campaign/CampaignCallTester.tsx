
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Phone, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CampaignCallTesterProps {
  campaignId?: string;
  agentId?: string;
  agentName?: string;
  onClose?: () => void;
  phoneNumber?: string;
  leadName?: string;
  leadId?: string;
  onCallComplete?: () => void;
}

export function CampaignCallTester({
  campaignId,
  agentId,
  agentName = "Agente",
  onClose,
  phoneNumber: initialPhone = "",
  leadName,
  leadId,
  onCallComplete
}: CampaignCallTesterProps) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [isLoading, setIsLoading] = useState(false);
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  
  const handleMakeCall = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error("Por favor, insira um número de telefone válido");
      return;
    }
    
    setIsLoading(true);
    setCallStatus("Iniciando chamada...");
    setErrorDetails(null);
    
    try {
      // Get the callback URL for tracking call status
      const origin = window.location.origin;
      const callbackUrl = `${origin}/api/call-status`;
      
      // Create the prompt with lead name if available
      let greeting = `Olá, aqui é ${agentName}. `;
      if (leadName) {
        greeting = `Olá ${leadName}, aqui é ${agentName}. `;
      }
      
      const twimlInstructions = `
        <Response>
          <Say language="pt-BR">${greeting} Esta é uma chamada de teste da nossa plataforma.</Say>
          <Pause length="1"/>
          <Say language="pt-BR">Obrigado por testar nosso sistema de chamadas automáticas.</Say>
        </Response>
      `;

      console.log("Enviando requisição para make-call com:", {
        phoneNumber,
        agentId,
        campaignId
      });
      
      // Make the call
      const { data, error } = await supabase.functions.invoke('make-call', {
        body: { 
          phoneNumber, 
          callbackUrl,
          agentId,
          campaignId,
          agentName,
          twimlInstructions
        }
      });

      if (error) {
        console.error("Erro da função make-call:", error);
        throw new Error(error.message);
      }
      
      console.log("Resposta da função make-call:", data);
      
      if (!data.success) {
        throw new Error(data.error || "Falha ao fazer chamada");
      }

      // Update lead status if we have a leadId
      if (leadId) {
        await supabase
          .from("leads")
          .update({
            status: "called",
            call_result: "Chamada de teste realizada"
          })
          .eq("id", leadId);
          
        if (onCallComplete) {
          onCallComplete();
        }
      }

      setCallStatus(`Chamada iniciada com sucesso! ID: ${data.callSid}`);
      toast.success("Chamada iniciada com sucesso!");
    } catch (err: any) {
      console.error('Erro ao fazer chamada:', err);
      setCallStatus(`Erro: ${err.message}`);
      setErrorDetails(`Detalhes: ${JSON.stringify(err, null, 2)}`);
      toast.error("Erro ao fazer chamada: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="p-4 space-y-4">
      <div className="space-y-1">
        <h3 className="text-lg font-medium">
          {leadName ? `Testar chamada para ${leadName}` : 
            (campaignId ? "Testar chamada da campanha" : `Testar chamada: ${agentName}`)}
        </h3>
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
          className="flex items-center gap-2 w-full bg-blue-700 hover:bg-blue-800"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
          <span>Fazer Chamada de Teste</span>
        </Button>
        
        {callStatus && (
          <div className={`p-3 rounded-md text-sm ${callStatus.includes('Erro') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            <div className="flex items-start gap-2">
              {callStatus.includes('Erro') ? (
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              ) : (
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
              )}
              <div>
                <p>{callStatus}</p>
                {errorDetails && (
                  <div className="mt-2 text-xs bg-red-100 p-2 rounded overflow-auto max-h-24">
                    <pre>{errorDetails}</pre>
                  </div>
                )}
                {callStatus.includes('Erro') && (
                  <div className="mt-2 text-xs">
                    <p>Verifique:</p>
                    <ul className="list-disc pl-4 space-y-1">
                      <li>Se as credenciais do Twilio estão configuradas corretamente</li>
                      <li>Se o número de telefone do Twilio está ativo e configurado</li>
                      <li>Se o formato do número está correto (DDD + número)</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>
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
