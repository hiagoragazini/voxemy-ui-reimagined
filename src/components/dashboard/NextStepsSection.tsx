
import React from "react";
import { MessageSquare, Phone, Settings } from "lucide-react";
import { NextStepCard } from "./NextStepCard";
import { NewFeaturesBanner } from "./NewFeaturesBanner";

export function NextStepsSection() {
  return (
    <div className="mb-6">
      <NewFeaturesBanner />
      
      <div className="mb-2">
        <h2 className="text-xl font-semibold mb-1 text-gray-800 dark:text-gray-200">
          Próximos Passos
        </h2>
        <p className="text-muted-foreground text-sm">
          Complete estas etapas para começar a usar o sistema de atendimento automatizado
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <NextStepCard
          number={1}
          title="Criar agente WhatsApp"
          description="Configure um agente de IA para atender automaticamente via WhatsApp com respostas personalizadas."
          icon={<MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          status="available"
          recommended={true}
        />

        <NextStepCard
          number={2}
          title="Testar chamadas de voz"
          description="Agentes de voz com IA estão em desenvolvimento para automatizar ligações telefônicas."
          icon={<Phone className="h-4 w-4 text-gray-500" />}
          status="coming-soon"
        />

        <NextStepCard
          number={3}
          title="Configurar integrações"
          description="Conecte seu CRM ou outras ferramentas para sincronizar dados automaticamente."
          icon={<Settings className="h-4 w-4 text-blue-600 dark:text-blue-400" />}
          status="available"
        />
      </div>

      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-xs text-blue-700 dark:text-blue-300 leading-relaxed">
          <strong>💡 Dica:</strong> Comece com agentes de WhatsApp para automatizar seu atendimento imediatamente. 
          Agentes de voz estarão disponíveis em breve com todas as configurações compatíveis.
        </p>
      </div>
    </div>
  );
}
