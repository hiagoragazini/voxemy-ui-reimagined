
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Play, Loader2, Users, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface RunCampaignButtonProps {
  campaignId: string;
  campaignName: string;
  totalLeads: number;
  pendingLeads: number;
  onCampaignRun?: () => void;
}

export function RunCampaignButton({ 
  campaignId, 
  campaignName, 
  totalLeads, 
  pendingLeads,
  onCampaignRun 
}: RunCampaignButtonProps) {
  const [isRunning, setIsRunning] = useState(false);
  const { toast } = useToast();

  const handleRunCampaign = async (dryRun: boolean = false) => {
    setIsRunning(true);
    
    try {
      console.log(`Iniciando campanha ${campaignId} - Modo: ${dryRun ? 'Simulação' : 'Produção'}`);
      
      const { data, error } = await supabase.functions.invoke('campaign-executor', {
        body: {
          campaignId: campaignId,
          maxCalls: Math.min(pendingLeads, 5), // Máximo 5 ligações por vez
          dryRun: dryRun,
          respectBusinessHours: true
        }
      });

      if (error) {
        console.error('Erro ao executar campanha:', error);
        throw error;
      }

      console.log('Resultado da execução:', data);

      if (data.success) {
        toast({
          title: dryRun ? "Simulação Concluída" : "Campanha Executada",
          description: data.message || `${data.processedLeads} leads processados com sucesso`,
        });

        // Chamar callback se fornecido
        if (onCampaignRun) {
          onCampaignRun();
        }
      } else {
        throw new Error(data.error || 'Erro desconhecido na execução');
      }

    } catch (error: any) {
      console.error('Erro na execução da campanha:', error);
      toast({
        title: "Erro",
        description: `Erro ao executar campanha: ${error.message}`,
        variant: "destructive"
      });
    } finally {
      setIsRunning(false);
    }
  };

  if (pendingLeads === 0) {
    return (
      <Button variant="outline" disabled>
        <Users className="mr-2 h-4 w-4" />
        Nenhum lead pendente
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button 
          className="bg-green-600 hover:bg-green-700"
          disabled={isRunning}
        >
          {isRunning ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          {isRunning ? 'Executando...' : 'Executar Campanha'}
        </Button>
      </AlertDialogTrigger>
      
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5" />
            Executar Campanha: {campaignName}
          </AlertDialogTitle>
          <AlertDialogDescription className="space-y-2">
            <p>
              Esta ação iniciará ligações automáticas para os leads pendentes.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg space-y-1">
              <p><strong>Total de leads:</strong> {totalLeads}</p>
              <p><strong>Leads pendentes:</strong> {pendingLeads}</p>
              <p><strong>Ligações nesta execução:</strong> {Math.min(pendingLeads, 5)}</p>
            </div>
            <p className="text-sm text-gray-600">
              As ligações serão feitas apenas em horário comercial (9h às 18h, Segunda a Sexta).
            </p>
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel>Cancelar</AlertDialogCancel>
          
          <AlertDialogAction
            onClick={() => handleRunCampaign(true)}
            variant="outline"
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Play className="mr-2 h-4 w-4" />
            )}
            Simular
          </AlertDialogAction>
          
          <AlertDialogAction
            onClick={() => handleRunCampaign(false)}
            className="bg-green-600 hover:bg-green-700"
            disabled={isRunning}
          >
            {isRunning ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Phone className="mr-2 h-4 w-4" />
            )}
            Executar Agora
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
