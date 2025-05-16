
import React from "react";
import { PhoneCall, Clock, CheckCircle2 } from "lucide-react";
import { StatsCard } from "./StatsCard";

export function StatsOverview() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <StatsCard
        title="Total de Chamadas Hoje"
        value="254"
        change={{
          value: "12% em relação a ontem",
          type: "increase"
        }}
        icon={<PhoneCall className="w-5 h-5 text-blue-700 dark:text-blue-400" />}
      />
      
      <StatsCard
        title="Tempo Médio de Chamada"
        value="3:24"
        change={{
          value: "Estável em relação a ontem",
          type: "neutral"
        }}
        icon={<Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />}
      />
      
      <StatsCard
        title="Taxa de Sucesso Global"
        value="78.5%"
        change={{
          value: "3.2% em relação a ontem",
          type: "increase"
        }}
        icon={<CheckCircle2 className="w-5 h-5 text-green-600 dark:text-green-400" />}
      />
    </div>
  );
}
