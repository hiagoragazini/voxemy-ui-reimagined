
import { useState } from "react";
import { toast } from "sonner";
import { diagnoseAgentIssues } from "@/utils/dbVerify";

export function useAgentDiagnostics(refetch: () => Promise<any>) {
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  
  // Diagnose function
  const handleDiagnose = async () => {
    setIsDiagnosing(true);
    toast.info("Iniciando diagnóstico do sistema...");
    
    try {
      const result = await diagnoseAgentIssues();
      await refetch();
      if (result) {
        toast.info("Diagnóstico concluído. Se os agentes ainda não aparecerem, clique em Recarregar.", {
          duration: 10000,
          action: {
            label: "Recarregar",
            onClick: () => window.location.reload()
          }
        });
      }
    } finally {
      setIsDiagnosing(false);
    }
  };

  return {
    isDiagnosing,
    handleDiagnose
  };
}
