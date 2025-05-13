
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export function FunctionTester() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testFunction = async () => {
    setIsLoading(true);
    setResult(null);
    setError(null);

    try {
      // Teste simples que não faz uma chamada, apenas verifica se a função está acessível
      const { data, error } = await supabase.functions.invoke('make-call', {
        body: { 
          test: true, // Isso deve ser tratado na função para não realizar a chamada
        }
      });

      if (error) {
        throw error;
      }

      setResult(JSON.stringify(data, null, 2));
    } catch (err: any) {
      console.error('Erro ao testar função:', err);
      setError(err.message || 'Erro desconhecido ao testar função');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="p-4 max-w-lg">
      <h2 className="text-lg font-medium mb-4">Teste de Função Edge</h2>
      
      <Button
        onClick={testFunction}
        disabled={isLoading}
        className="mb-4"
      >
        {isLoading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Testando...
          </>
        ) : (
          "Testar make-call"
        )}
      </Button>
      
      {result && (
        <div className="bg-green-50 p-3 rounded-md border border-green-200 mt-2">
          <h3 className="font-medium text-sm mb-1">Função acessível:</h3>
          <pre className="text-xs overflow-auto max-h-60 bg-white p-2 rounded">
            {result}
          </pre>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 p-3 rounded-md border border-red-200 mt-2">
          <h3 className="font-medium text-sm mb-1">Erro ao testar função:</h3>
          <pre className="text-xs overflow-auto max-h-60 bg-white p-2 rounded text-red-700">
            {error}
          </pre>
        </div>
      )}
    </Card>
  );
}
