
import React from "react";
import { PhoneCall, Zap, CheckCircle2 } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function StatsOverview() {
  // Buscar estatísticas de chamadas do banco de dados
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Aqui você implementaria a lógica real para buscar as estatísticas
      // Por enquanto, retornamos dados simulados
      return {
        totalCalls: "254",
        avgTokens: "1.2K",
        successRate: "78.5%",
        callsChange: "+12%",
        tokensChange: "Estável",
        successChange: "+3.2%"
      };
    },
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <StatsCard
        title="Total de Chamadas Hoje"
        value={stats?.totalCalls || "0"}
        change={{
          value: `${stats?.callsChange || "0%"} em relação a ontem`,
          type: "increase"
        }}
        icon={<PhoneCall className="w-5 h-5 text-blue-700 dark:text-blue-400" />}
      />
      
      <StatsCard
        title="Tokens Médios"
        value={stats?.avgTokens || "0"}
        change={{
          value: `${stats?.tokensChange || "Sem dados"} em relação a ontem`,
          type: "neutral"
        }}
        icon={<Zap className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
      />
      
      <StatsCard
        title="Taxa de Sucesso Global"
        value={stats?.successRate || "0%"}
        change={{
          value: `${stats?.successChange || "0%"} em relação a ontem`,
          type: "increase"
        }}
        icon={<CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />}
      />
    </div>
  );
}
