
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Loader2, Clock, CalendarDays } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CRON_PRESETS = [
  { label: "A cada 5 minutos", value: "*/5 * * * *" },
  { label: "A cada 10 minutos", value: "*/10 * * * *" },
  { label: "A cada 30 minutos", value: "*/30 * * * *" },
  { label: "A cada hora", value: "0 * * * *" },
  { label: "A cada 2 horas", value: "0 */2 * * *" },
  { label: "A cada 6 horas", value: "0 */6 * * *" },
  { label: "Uma vez por dia (9h)", value: "0 9 * * *" },
  { label: "Personalizado", value: "custom" }
];

interface CampaignSchedulerProps {
  campaignId?: string;
}

export function CampaignScheduler({ campaignId }: CampaignSchedulerProps) {
  const [loading, setLoading] = useState(false);
  const [interval, setInterval] = useState(CRON_PRESETS[0].value);
  const [customInterval, setCustomInterval] = useState("");
  const [maxCalls, setMaxCalls] = useState(5);
  const [respectBusinessHours, setRespectBusinessHours] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const effectiveInterval = interval === "custom" ? customInterval : interval;
      
      const { data, error } = await supabase.functions.invoke("setup-cron-job", {
        body: {
          interval: effectiveInterval,
          maxCalls,
          campaignId, // Optional, if we want to schedule a specific campaign
          respectBusinessHours
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (data?.success) {
        toast.success("Agendamento configurado com sucesso!");
      } else {
        throw new Error(data?.error || "Falha ao configurar agendamento");
      }
    } catch (error: any) {
      console.error("Error setting up schedule:", error);
      toast.error("Erro ao configurar agendamento: " + (error.message || "Erro desconhecido"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Agendamento de Campanha
        </CardTitle>
        <CardDescription>
          Configure o intervalo de execução automática da campanha
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="interval">Intervalo de Execução</Label>
            <Select 
              value={interval} 
              onValueChange={setInterval}
            >
              <SelectTrigger id="interval">
                <SelectValue placeholder="Selecione um intervalo" />
              </SelectTrigger>
              <SelectContent>
                {CRON_PRESETS.map((preset) => (
                  <SelectItem key={preset.value} value={preset.value}>
                    {preset.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {interval === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="customInterval">Intervalo Personalizado (Formato CRON)</Label>
              <Input
                id="customInterval"
                placeholder="*/15 * * * *"
                value={customInterval}
                onChange={(e) => setCustomInterval(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Formato: minuto hora dia-do-mês mês dia-da-semana
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="maxCalls">Máximo de Chamadas por Execução</Label>
            <Input
              id="maxCalls"
              type="number"
              min={1}
              max={50}
              value={maxCalls}
              onChange={(e) => setMaxCalls(Number(e.target.value))}
            />
            <p className="text-xs text-muted-foreground">
              Limite o número de chamadas feitas em cada execução automática
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch 
              id="respectBusinessHours" 
              checked={respectBusinessHours} 
              onCheckedChange={setRespectBusinessHours} 
            />
            <Label htmlFor="respectBusinessHours" className="cursor-pointer">
              Respeitar horário comercial (9h às 18h, seg-sex)
            </Label>
          </div>
        </CardContent>
        <CardFooter className="flex justify-end">
          <Button 
            type="submit"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Configurando...
              </>
            ) : (
              <>
                <CalendarDays className="mr-2 h-4 w-4" />
                Aplicar Agendamento
              </>
            )}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
