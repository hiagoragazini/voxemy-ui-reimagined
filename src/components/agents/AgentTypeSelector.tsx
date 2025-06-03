
import React from 'react';
import { TooltipCustom } from '@/components/ui/tooltip-custom';
import { cn } from '@/lib/utils';

interface AgentTypeSelectorProps {
  value: 'text' | 'voice';
  onChange: (value: 'text' | 'voice') => void;
  className?: string;
}

export function AgentTypeSelector({ value, onChange, className }: AgentTypeSelectorProps) {
  return (
    <div className={cn("agent-type-selector", className)}>
      <h3 className="text-lg font-semibold mb-4">Tipo de Agente</h3>
      
      <div className="space-y-3">
        <label className={cn(
          "radio-option block border rounded-lg p-4 cursor-pointer transition-all duration-200",
          value === 'text' 
            ? "border-green-500 bg-green-50" 
            : "border-gray-200 hover:border-green-300 hover:bg-gray-50"
        )}>
          <input
            type="radio"
            name="agentType"
            value="text"
            checked={value === 'text'}
            onChange={() => onChange('text')}
            className="sr-only"
          />
          <div className="flex items-start gap-3">
            <span className="text-2xl">💬</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <strong className="text-base">Atendimento por Texto</strong>
                <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
                  Disponível
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Agente responde mensagens via WhatsApp com respostas automáticas inteligentes
              </p>
            </div>
          </div>
        </label>
        
        <TooltipCustom content="Agentes de voz estão em desenvolvimento e estarão disponíveis em breve">
          <label className={cn(
            "radio-option block border rounded-lg p-4 transition-all duration-200",
            value === 'voice' 
              ? "border-orange-500 bg-orange-50" 
              : "opacity-70 cursor-not-allowed bg-gray-50 border-dashed border-gray-300"
          )}>
            <input
              type="radio"
              name="agentType"
              value="voice"
              checked={value === 'voice'}
              onChange={() => onChange('voice')}
              disabled
              className="sr-only"
            />
            <div className="flex items-start gap-3">
              <span className="text-2xl">🎤</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <strong className="text-base text-gray-600">Atendimento por Voz</strong>
                  <span className="bg-gray-500 text-white text-xs px-2 py-1 rounded-full">
                    Em Breve
                  </span>
                </div>
                <p className="text-sm text-gray-500">
                  Agente realiza chamadas telefônicas com IA e voz natural
                </p>
              </div>
            </div>
          </label>
        </TooltipCustom>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
        <p className="text-sm text-blue-800">
          <strong>Nota:</strong> Agentes de voz estão em desenvolvimento. 
          Por enquanto, recomendamos criar agentes de texto via WhatsApp 
          para começar a automatizar seu atendimento imediatamente.
        </p>
      </div>
    </div>
  );
}
