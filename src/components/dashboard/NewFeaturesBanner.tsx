
import React from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function NewFeaturesBanner() {
  const navigate = useNavigate();

  const handleCreateAgent = () => {
    navigate("/agents/new");
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-sky-50 border border-blue-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <div className="bg-blue-100 p-2 rounded-lg">
          <MessageSquare className="h-6 w-6 text-blue-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-blue-900 mb-1">
            🚀 Novo! Agentes de Texto via WhatsApp
          </h3>
          <p className="text-sm text-blue-700 mb-2">
            Automatize seu atendimento via WhatsApp com agentes de IA. 
            Agentes de voz estarão disponíveis em breve.
          </p>
          <Button 
            onClick={handleCreateAgent}
            className="bg-blue-600 hover:bg-blue-700 text-white text-xs h-8"
          >
            Criar Agente de Texto
            <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
