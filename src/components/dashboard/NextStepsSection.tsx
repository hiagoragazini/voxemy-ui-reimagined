
import React from "react";
import { PhoneCall, Plus, Settings } from "lucide-react";
import { NextStepCard } from "./NextStepCard";
import { QuickCallCard } from "./QuickCallCard";

export function NextStepsSection() {
  return (
    <div className="mb-8">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold mb-2 text-gray-800 dark:text-gray-200">
          Próximos Passos
        </h2>
        <p className="text-muted-foreground">
          Complete estas etapas para começar a usar o sistema de chamadas automatizadas
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <NextStepCard
          number={1}
          title="Testar uma chamada real"
          description="Selecione um agente e faça uma ligação para testar o sistema e verificar a qualidade da voz."
          icon={<PhoneCall className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
        />

        <NextStepCard
          number={2}
          title="Adicionar leads"
          description="Importe seus contatos para o sistema realizar chamadas automatizadas em escala."
          icon={<Plus className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
        />

        <NextStepCard
          number={3}
          title="Configurar integrações"
          description="Conecte seu CRM ou outras ferramentas para sincronizar dados automaticamente."
          icon={<Settings className="h-6 w-6 text-blue-600 dark:text-blue-400" />}
        />

        {/* Quick Call Card */}
        <QuickCallCard />
      </div>
    </div>
  );
}
