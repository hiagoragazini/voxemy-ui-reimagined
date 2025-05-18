
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Loader2, PhoneCall } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useVapiCall } from "@/hooks/use-vapi-call";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";

export function VapiIntegrationCheck() {
  const [isVerifying, setIsVerifying] = useState(false);
  const [isTestingCall, setIsTestingCall] = useState(false);
  const { makeCall, isLoading: callLoading } = useVapiCall();

  // Query for checking Vapi configuration
  const { data: configData, isLoading: configLoading, refetch } = useQuery({
    queryKey: ['vapi-config'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("verify-vapi-config");
      
      if (error) throw new Error(error.message);
      return data;
    },
    enabled: false, // Don't run automatically on component mount
  });

  // Query to fetch agents
  const { data: agents, isLoading: agentsLoading } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('agents')
        .select('*')
        .eq('status', 'active')
        .limit(5);
      
      if (error) throw new Error(error.message);
      return data || [];
    }
  });

  const handleVerifyConfig = async () => {
    setIsVerifying(true);
    try {
      await refetch();
      toast.success("Configuration check completed");
    } catch (error) {
      toast.error(`Error checking configuration: ${error.message}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTestCall = async () => {
    // Safety check - make sure we have agents to work with
    if (!agents || agents.length === 0) {
      toast.error("No active agents found. Please create an agent first.");
      return;
    }

    setIsTestingCall(true);
    try {
      // Get the first active agent
      const testAgent = agents[0];
      
      // Get your phone number for testing - REPLACE THIS WITH YOUR OWN NUMBER
      const phoneNumber = prompt("Enter your phone number for test call:", "");
      
      if (!phoneNumber) {
        toast.warning("Test cancelled - no phone number provided");
        return;
      }

      const testMessage = `Olá, aqui é ${testAgent.name}. Esta é uma chamada de teste da plataforma Vocalize AI. Se você está ouvindo esta mensagem, a integração foi configurada com sucesso. Obrigado!`;
      
      const result = await makeCall({
        agentId: testAgent.id,
        phoneNumber,
        message: testMessage,
        voiceId: testAgent.voice_id
      });
      
      if (result) {
        toast.success("Test call initiated successfully!");
      } else {
        throw new Error("Failed to initiate test call");
      }
    } catch (error) {
      toast.error(`Error making test call: ${error.message}`);
    } finally {
      setIsTestingCall(false);
    }
  };

  return (
    <Card className="p-5 shadow-sm border">
      <h3 className="text-xl font-semibold mb-4">Vapi Integration Status</h3>
      
      <div className="grid gap-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">Vapi API</p>
            <p className="text-sm text-muted-foreground">Serviço de chamadas de voz</p>
          </div>
          {!configLoading && configData ? (
            <Badge variant={configData.vapi.valid ? "success" : "destructive"}>
              {configData.vapi.valid ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Configurado
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Problema de Configuração
                </span>
              )}
            </Badge>
          ) : (
            <Badge variant="outline">Não verificado</Badge>
          )}
        </div>
        
        <div className="flex justify-between items-center">
          <div>
            <p className="font-medium">ElevenLabs</p>
            <p className="text-sm text-muted-foreground">Serviço de vozes realistas</p>
          </div>
          {!configLoading && configData ? (
            <Badge variant={configData.elevenlabs.configured ? "success" : "destructive"}>
              {configData.elevenlabs.configured ? (
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Configurado
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> Não Configurado
                </span>
              )}
            </Badge>
          ) : (
            <Badge variant="outline">Não verificado</Badge>
          )}
        </div>
        
        {!configLoading && configData && !configData.vapi.valid && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Problema com a configuração da Vapi</AlertTitle>
            <AlertDescription>
              A chave API da Vapi não está configurada ou é inválida. Verifique a configuração no painel do Supabase.
            </AlertDescription>
          </Alert>
        )}
        
        {!configLoading && configData && !configData.elevenlabs.configured && (
          <Alert variant="destructive" className="mt-2">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>ElevenLabs não configurada</AlertTitle>
            <AlertDescription>
              A chave API da ElevenLabs não está configurada. Esta chave é necessária para vozes de alta qualidade.
            </AlertDescription>
          </Alert>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button 
          onClick={handleVerifyConfig}
          disabled={isVerifying || configLoading}
          variant="outline"
          className="flex-1"
        >
          {isVerifying || configLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Verificando...
            </>
          ) : (
            <>Verificar Configuração</>
          )}
        </Button>

        <Button
          onClick={handleTestCall}
          disabled={isTestingCall || callLoading || agentsLoading || !agents || agents.length === 0}
          variant="default"
          className="flex-1"
        >
          {isTestingCall || callLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Iniciando chamada...
            </>
          ) : (
            <>
              <PhoneCall className="h-4 w-4 mr-2" />
              Fazer Chamada de Teste
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
