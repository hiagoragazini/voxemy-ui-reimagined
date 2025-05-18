
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Loader2, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";

interface RunCampaignButtonProps {
  campaignId: string;
  maxCalls?: number;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showAlert?: boolean;
}

export function RunCampaignButton({ 
  campaignId, 
  maxCalls = 3,
  variant = "outline",
  size = "sm",
  className = "",
  showAlert = false
}: RunCampaignButtonProps) {
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);

  // Check if API keys are configured correctly
  const { data: configData } = useQuery({
    queryKey: ['vapi-config-check'],
    queryFn: async () => {
      try {
        const { data, error } = await supabase.functions.invoke("verify-vapi-config");
        if (error) throw error;
        return data;
      } catch (error) {
        console.error("Error checking Vapi config:", error);
        return {
          vapi: { valid: false },
          elevenlabs: { configured: false }
        };
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const isConfigurationValid = configData?.vapi?.valid && configData?.elevenlabs?.configured;

  const handleRunCampaign = async () => {
    try {
      setLoading(true);
      setShowError(false);
      
      // Check if configuration is valid
      if (!isConfigurationValid) {
        throw new Error("API configuration is incomplete. Please verify Vapi and ElevenLabs API keys.");
      }
      
      const { data, error } = await supabase.functions.invoke("campaign-executor", {
        body: {
          campaignId,
          maxCalls,
          dryRun: false
        }
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data?.success) {
        toast.success(
          `Campanha executada com sucesso! ${data.processedLeads || 0} leads processados.`,
          { duration: 5000 }
        );
      } else {
        throw new Error(data?.error || "Erro ao executar campanha");
      }
    } catch (error: any) {
      console.error("Error running campaign:", error);
      toast.error("Erro ao executar campanha: " + (error.message || "Erro desconhecido"));
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className={className}>
      <Button
        variant={variant}
        size={size}
        disabled={loading || !isConfigurationValid}
        onClick={handleRunCampaign}
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Executando...
          </>
        ) : (
          <>
            <Phone className="h-4 w-4 mr-2" />
            Executar Agora
          </>
        )}
      </Button>
      
      {(showAlert && showError) && (
        <Alert variant="destructive" className="mt-2">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Erro ao executar campanha</AlertTitle>
          <AlertDescription>
            Verifique a configuração das APIs Vapi e ElevenLabs e tente novamente.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
