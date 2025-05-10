
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Phone, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RunCampaignButtonProps {
  campaignId: string;
  maxCalls?: number;
  variant?: "default" | "outline" | "secondary" | "destructive" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function RunCampaignButton({ 
  campaignId, 
  maxCalls = 3,
  variant = "outline",
  size = "sm",
  className = ""
}: RunCampaignButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleRunCampaign = async () => {
    try {
      setLoading(true);
      
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
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      className={className}
      disabled={loading}
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
  );
}
