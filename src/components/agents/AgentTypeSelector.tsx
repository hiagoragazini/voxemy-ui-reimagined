
import React from 'react';
import { cn } from '@/lib/utils';

interface AgentTypeSelectorProps {
  value: 'text' | 'voice' | 'hybrid';
  onChange: (value: 'text' | 'voice' | 'hybrid') => void;
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
            ? "border-violet-500 bg-violet-50" 
            : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
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
        
        <label className={cn(
          "radio-option block border rounded-lg p-4 cursor-pointer transition-all duration-200",
          value === 'voice' 
            ? "border-violet-500 bg-violet-50" 
            : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
        )}>
          <input
            type="radio"
            name="agentType"
            value="voice"
            checked={value === 'voice'}
            onChange={() => onChange('voice')}
            className="sr-only"
          />
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎤</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <strong className="text-base">Atendimento por Voz</strong>
                <span className="bg-violet-600 text-white text-xs px-2 py-1 rounded-full">
                  Disponível
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Agente realiza chamadas telefônicas com IA e voz natural
              </p>
            </div>
          </div>
        </label>

        <label className={cn(
          "radio-option block border rounded-lg p-4 cursor-pointer transition-all duration-200",
          value === 'hybrid' 
            ? "border-violet-500 bg-violet-50" 
            : "border-gray-200 hover:border-violet-300 hover:bg-gray-50"
        )}>
          <input
            type="radio"
            name="agentType"
            value="hybrid"
            checked={value === 'hybrid'}
            onChange={() => onChange('hybrid')}
            className="sr-only"
          />
          <div className="flex items-start gap-3">
            <span className="text-2xl">🔄</span>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <strong className="text-base">Híbrido (Voz + Texto)</strong>
                <span className="bg-orange-600 text-white text-xs px-2 py-1 rounded-full">
                  Disponível
                </span>
              </div>
              <p className="text-sm text-gray-600">
                Agente atende via WhatsApp e chamadas telefônicas com suporte completo
              </p>
            </div>
          </div>
        </label>
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
        <p className="text-sm text-blue-800">
          <strong>Dica:</strong> Escolha o tipo de agente baseado em como seus clientes preferem se comunicar. 
          Agentes híbridos oferecem máxima flexibilidade atendendo por texto e voz.
        </p>
      </div>
    </div>
  );
}
