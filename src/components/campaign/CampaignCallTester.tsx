
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Phone, AlertCircle, HelpCircle, ExternalLink, ArrowRight, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useVoiceCall } from "@/hooks/use-voice-call";

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
  const [callStatus, setCallStatus] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showTroubleshooting, setShowTroubleshooting] = useState(false);
  const [callSid, setCallSid] = useState<string | null>(null);
  const [showLogs, setShowLogs] = useState(false);
  const [functionTested, setFunctionTested] = useState(false);
  const [functionTestResult, setFunctionTestResult] = useState<any>(null);
  
  const { isLoading, makeCall, error, testMakeCallFunction } = useVoiceCall();
  
  // Testar conectividade com a função na montagem
  useEffect(() => {
    testFunctionConnectivity();
  }, []);
  
  const testFunctionConnectivity = async () => {
    setCallStatus("Verificando conectividade com a função make-call...");
    const result = await testMakeCallFunction();
    
    if (result && result.success) {
      setFunctionTested(true);
      setFunctionTestResult(result);
      setCallStatus("Função make-call está acessível! Pronto para fazer chamadas.");
    } else {
      setFunctionTested(false);
      setCallStatus("Erro: Não foi possível acessar a função make-call.");
      setErrorDetails("A função make-call não está respondendo corretamente. Verifique os logs e configurações da função.");
      setShowTroubleshooting(true);
    }
  };
  
  const formatPhoneForDisplay = (phone: string) => {
    // Simple formatting for display (not for API calls)
    if (!phone) return "";
    
    // Remove all non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // Format for Brazil phone numbers
    if (cleaned.length === 11) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 7)}-${cleaned.substring(7, 11)}`;
    } else if (cleaned.length === 10) {
      return `(${cleaned.substring(0, 2)}) ${cleaned.substring(2, 6)}-${cleaned.substring(6, 10)}`;
    }
    
    return cleaned;
  };
  
  const handleMakeCall = async () => {
    if (!phoneNumber || phoneNumber.length < 8) {
      toast.error("Por favor, insira um número de telefone válido");
      return;
    }
    
    setCallStatus("Iniciando chamada...");
    setErrorDetails(null);
    setCallSid(null);
    setShowLogs(false);
    
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
          <Say language="pt-BR">${greeting} Esta é uma chamada de teste da plataforma Voxemy.</Say>
          <Pause length="1"/>
          <Say language="pt-BR">Obrigado por testar nosso sistema de chamadas automáticas.</Say>
        </Response>
      `;

      console.log("Enviando requisição para make-call com:", {
        phoneNumber,
        agentId,
        campaignId,
        leadId,
        callbackUrl
      });
      
      // Use o hook make-call para fazer a chamada
      const callResult = await makeCall({
        phoneNumber,
        agentId,
        campaignId,
        message: twimlInstructions
      });

      console.log("Resposta da função make-call:", callResult);

      if (!callResult) {
        throw new Error(error || "Falha ao fazer chamada: nenhuma resposta recebida");
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

      setCallSid(callResult.callSid);
      setCallStatus(`Chamada iniciada com sucesso! Status: ${callResult.status || 'iniciada'}`);
      
      // Poll for call status updates if we have a call SID
      if (callResult.callSid) {
        pollCallStatus(callResult.callSid);
      }
    } catch (err: any) {
      console.error('Erro ao fazer chamada:', err);
      setCallStatus(`Erro: ${err.message}`);
      
      // Adicionar detalhes técnicos para depuração
      if (err.response) {
        setErrorDetails(`Status: ${err.response.status}\nDetalhes: ${JSON.stringify(err.response.data)}`);
      } else {
        setErrorDetails(`Erro detalhado: ${err.stack || JSON.stringify(err)}`);
      }
      
      // Check if the error is related to Twilio credentials
      if (err.message?.includes("Twilio") || 
          err.message?.includes("Authentication") || 
          err.message?.includes("credentials")) {
        setShowTroubleshooting(true);
      }
    }
  };
  
  // Function to poll call status
  const pollCallStatus = async (sid: string) => {
    try {
      const { data: callLog } = await supabase
        .from("call_logs")
        .select("*")
        .eq("call_sid", sid)
        .single();
      
      if (callLog) {
        if (callLog.status !== "queued" && callLog.status !== "initiated" && callLog.status !== "ringing") {
          setCallStatus(`Chamada ${translateCallStatus(callLog.status)}${callLog.duration ? ` (Duração: ${formatDuration(callLog.duration)})` : ''}`);
          return; // Stop polling if call is completed or failed
        }
      }
      
      // Continue polling every 3 seconds if call is still active
      setTimeout(() => pollCallStatus(sid), 3000);
    } catch (e) {
      // Continue polling even if there's an error (might be racing with call log creation)
      setTimeout(() => pollCallStatus(sid), 3000);
    }
  };
  
  // Format duration in seconds to MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Translate call status to Portuguese
  const translateCallStatus = (status: string): string => {
    const statusMap: Record<string, string> = {
      'queued': 'na fila',
      'initiated': 'iniciada',
      'ringing': 'chamando',
      'in-progress': 'em andamento',
      'completed': 'completada',
      'busy': 'ocupado',
      'no-answer': 'sem resposta',
      'failed': 'falhou',
      'canceled': 'cancelada'
    };
    
    return statusMap[status] || status;
  };
  
  const viewCallLogsInDashboard = () => {
    window.open('/dashboard/logs', '_blank');
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

      {/* Status da função make-call */}
      {functionTested && functionTestResult && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Função make-call está acessível</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Variáveis de ambiente: {" "}
                {functionTestResult.env?.twilioAccountSidConfigured ? (
                  <span className="text-green-600">TWILIO_ACCOUNT_SID ✓</span>
                ) : (
                  <span className="text-red-600">TWILIO_ACCOUNT_SID ✗</span>
                )}{", "}
                {functionTestResult.env?.twilioAuthTokenConfigured ? (
                  <span className="text-green-600">TWILIO_AUTH_TOKEN ✓</span>
                ) : (
                  <span className="text-red-600">TWILIO_AUTH_TOKEN ✗</span>
                )}{", "}
                {functionTestResult.env?.twilioPhoneNumberConfigured ? (
                  <span className="text-green-600">TWILIO_PHONE_NUMBER ✓</span>
                ) : (
                  <span className="text-red-600">TWILIO_PHONE_NUMBER ✗</span>
                )}
              </p>
            </div>
          </div>
        </div>
      )}

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
          {phoneNumber && phoneNumber.length >= 8 && (
            <p className="text-xs text-blue-600">
              Número formatado: {formatPhoneForDisplay(phoneNumber)}
            </p>
          )}
        </div>
        
        <Button 
          onClick={handleMakeCall}
          disabled={isLoading || !phoneNumber || !functionTested}
          className="flex items-center gap-2 w-full bg-blue-700 hover:bg-blue-800"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Phone className="h-4 w-4" />
          )}
          <span>Fazer Chamada de Teste</span>
        </Button>
        
        {!functionTested && (
          <Button 
            onClick={testFunctionConnectivity}
            className="flex items-center gap-2 w-full"
          >
            <Loader2 className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Verificar Conectividade com a Função</span>
          </Button>
        )}
        
        {callStatus && (
          <div className={`p-3 rounded-md text-sm ${callStatus.includes('Erro') ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-green-50 text-green-700 border border-green-200'}`}>
            <div className="flex items-start gap-2">
              {callStatus.includes('Erro') ? (
                <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              ) : (
                <Phone className="h-4 w-4 mt-0.5 flex-shrink-0" />
              )}
              <div className="w-full">
                <p>{callStatus}</p>
                {callSid && (
                  <p className="text-xs mt-1">ID da chamada: {callSid}</p>
                )}
                
                {errorDetails && (
                  <div className="mt-2">
                    <button 
                      className="text-xs flex items-center gap-1 text-red-700"
                      onClick={() => setShowLogs(!showLogs)}
                    >
                      {showLogs ? "Ocultar detalhes" : "Mostrar detalhes"} 
                      <ArrowRight className={`h-3 w-3 transition-transform ${showLogs ? 'rotate-90' : ''}`} />
                    </button>
                    
                    {showLogs && (
                      <div className="mt-1 text-xs bg-red-100 p-2 rounded overflow-auto max-h-40">
                        <pre>{errorDetails}</pre>
                      </div>
                    )}
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
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="mt-2 text-xs flex items-center gap-1 p-0 h-auto hover:bg-transparent"
                      onClick={() => setShowTroubleshooting(!showTroubleshooting)}
                    >
                      <HelpCircle className="h-3 w-3" />
                      <span>{showTroubleshooting ? "Ocultar ajuda" : "Mostrar ajuda avançada"}</span>
                    </Button>
                  </div>
                )}
                
                {!callStatus.includes('Erro') && callSid && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 text-xs"
                    onClick={viewCallLogsInDashboard}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    Ver logs de chamadas
                  </Button>
                )}
              </div>
            </div>
            
            {showTroubleshooting && (
              <div className="mt-3 bg-amber-50 p-2 rounded border border-amber-200 text-xs">
                <h4 className="font-medium mb-1">Soluções comuns para problemas com o Twilio:</h4>
                <ol className="list-decimal pl-4 space-y-1">
                  <li>
                    <strong>Credenciais:</strong> Verifique se o TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN e TWILIO_PHONE_NUMBER estão configurados corretamente no Supabase.
                  </li>
                  <li>
                    <strong>Número do Twilio:</strong> Certifique-se de que seu número do Twilio está ativo e configurado para fazer ligações de voz.
                  </li>
                  <li>
                    <strong>Formato do número:</strong> O número precisa estar no formato internacional (ex: +5511999887766).
                  </li>
                  <li>
                    <strong>Conta de teste:</strong> Se estiver usando uma conta de teste do Twilio, pode haver limitações nas chamadas.
                  </li>
                  <li>
                    <strong>Verifique os logs:</strong> Consulte os logs da função Edge para mais detalhes sobre o erro.
                  </li>
                  <li>
                    <strong>Créditos:</strong> Verifique se sua conta do Twilio tem créditos suficientes para fazer chamadas.
                  </li>
                </ol>
                <div className="mt-2 flex justify-end">
                  <a 
                    href="https://www.twilio.com/docs/voice/troubleshooting" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 flex items-center gap-1 hover:underline"
                  >
                    <span>Documentação do Twilio</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
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
