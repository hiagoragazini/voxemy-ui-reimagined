
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCcw } from "lucide-react";

interface AgentDiagnosticsAlertProps {
  onDiagnose: () => void;
  isDiagnosing: boolean;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function AgentDiagnosticsAlert({
  onDiagnose,
  isDiagnosing,
  onRefresh,
  isRefreshing
}: AgentDiagnosticsAlertProps) {
  return (
    <Alert variant="default" className="mb-6 border-amber-200 bg-amber-50 text-amber-800">
      <AlertTriangle className="h-4 w-4" />
      <AlertTitle>Problemas com a exibição de agentes</AlertTitle>
      <AlertDescription>
        Parece que seus agentes não estão sendo exibidos corretamente. Utilize as opções abaixo para diagnosticar 
        e resolver problemas de conexão com o banco de dados.
      </AlertDescription>
      <div className="mt-4 flex gap-4">
        <Button 
          variant="secondary" 
          onClick={onDiagnose} 
          disabled={isDiagnosing}
          className="bg-amber-100 text-amber-800 hover:bg-amber-200"
        >
          {isDiagnosing ? (
            <><RefreshCcw className="h-4 w-4 mr-2 animate-spin" /> Diagnosticando...</>
          ) : (
            <>Diagnosticar problemas</>
          )}
        </Button>
        <Button 
          variant="outline" 
          onClick={onRefresh} 
          disabled={isRefreshing}
        >
          <RefreshCcw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} /> Atualizar
        </Button>
      </div>
    </Alert>
  );
}
