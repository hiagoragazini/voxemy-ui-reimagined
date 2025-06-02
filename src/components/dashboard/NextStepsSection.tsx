
import React from "react";
import { PhoneCall, Plus, Settings } from "lucide-react";
import { NextStepCard } from "./NextStepCard";
import { QuickCallCard } from "./QuickCallCard";

export function NextStepsSection() {
  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-3 text-gray-800 dark:text-gray-200">
        Próximos Passos
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <NextStepCard
          number={1}
          title="Testar uma chamada real"
          description="Selecione um agente e faça uma ligação para testar o sistema."
          icon={<PhoneCall className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
        />

        <NextStepCard
          number={2}
          title="Adicionar leads"
          description="Importe seus contatos para o sistema realizar chamadas automatizadas."
          icon={<Plus className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
        />

        <NextStepCard
          number={3}
          title="Configurar integrações"
          description="Conecte seu CRM ou outras ferramentas para sincronizar dados."
          icon={<Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
        />

        {/* Quick Call Card */}
        <QuickCallCard />
      </div>
    </div>
  );
}
