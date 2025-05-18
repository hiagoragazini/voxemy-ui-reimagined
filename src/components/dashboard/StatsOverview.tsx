
import React from "react";
import { PhoneCall, Clock, CheckCircle2 } from "lucide-react";
import { StatsCard } from "./StatsCard";
import { useQuery } from "@tanstack/react-query";

export function StatsOverview() {
  // Fetch call statistics from the database
  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      // Here you would implement the actual logic to fetch statistics
      // For now, we return simulated data
      return {
        totalCalls: "254",
        avgCallTime: "3:24",
        successRate: "78.5%",
        callsChange: "+12%",
        timeChange: "Estável",
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
        title="Tempo Médio de Chamada"
        value={stats?.avgCallTime || "0:00"}
        change={{
          value: `${stats?.timeChange || "Sem dados"} em relação a ontem`,
          type: "neutral"
        }}
        icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
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
