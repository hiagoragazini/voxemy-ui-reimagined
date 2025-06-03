
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout } from '@/components/dashboard/Layout';
import { Button } from '@/components/ui/button';
import { AgentTypeSelector } from '@/components/agents/AgentTypeSelector';
import { ArrowRight, ArrowLeft } from 'lucide-react';

export default function AgentTypeSelection() {
  const navigate = useNavigate();
  const [selectedType, setSelectedType] = useState<'text' | 'voice' | null>(null);

  const handleContinue = () => {
    if (selectedType) {
      // Redireciona para o formulário de configuração com o tipo selecionado
      navigate(`/agents/new/config?type=${selectedType}`);
    }
  };

  const handleBack = () => {
    navigate('/agents');
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <div className="flex flex-col mb-8">
          <h1 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-violet-700 to-violet-500">
            Criar Novo Agente
          </h1>
          <p className="mt-1 text-muted-foreground max-w-3xl">
            Escolha o tipo de agente que deseja criar para começar a configuração.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-sm border p-8">
            <AgentTypeSelector
              value={selectedType || 'text'}
              onChange={(value) => setSelectedType(value)}
              className="mb-8"
            />

            <div className="flex justify-between items-center">
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Voltar
              </Button>

              <Button
                onClick={handleContinue}
                disabled={!selectedType}
                className="bg-violet-600 hover:bg-violet-700 flex items-center gap-2"
              >
                Continuar
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
