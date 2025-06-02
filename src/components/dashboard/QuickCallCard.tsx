
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Phone, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConversationRelay } from "@/hooks/use-conversation-relay";
import { toast } from "sonner";

export function QuickCallCard() {
  const [selectedAgent, setSelectedAgent] = useState<string>("");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const { makeCall, isLoading } = useConversationRelay();

  // Fetch agents for selection
  const { data: agents = [] } = useQuery({
    queryKey: ['agents-quick-call'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("agents")
        .select("id, name, status")
        .eq("status", "active")
        .order("name");
        
      if (error) throw error;
      return data || [];
    }
  });

  const handleQuickCall = async () => {
    if (!selectedAgent || !phoneNumber) {
      toast.error("Selecione um agente e insira um número de telefone");
      return;
    }

    // Clean phone number
    const cleanPhone = phoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Número de telefone deve ter pelo menos 10 dígitos");
      return;
    }

    try {
      const result = await makeCall({
        phoneNumber: cleanPhone,
        agentId: selectedAgent,
        testMode: true
      });

      if (result) {
        toast.success("Chamada rápida iniciada com sucesso!");
        setPhoneNumber("");
      }
    } catch (error) {
      console.error("Erro na chamada rápida:", error);
    }
  };

  return (
    <Card className="hover:shadow-apple-hover transition-all duration-200 hover:-translate-y-1 flex flex-col justify-start border border-gray-200 rounded-xl shadow-apple">
      <CardHeader className="p-4 pb-2">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Phone className="h-5 w-5 text-blue-600" />
          </div>
          Chamada Rápida
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 p-4 pt-0">
        <div className="space-y-1">
          <Label htmlFor="agent-select" className="text-sm font-medium text-gray-700">Selecionar Agente</Label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="h-9 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500">
              <SelectValue placeholder="Escolha um agente" />
            </SelectTrigger>
            <SelectContent>
              {agents.map((agent) => (
                <SelectItem key={agent.id} value={agent.id}>
                  {agent.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1">
          <Label htmlFor="phone-input" className="text-sm font-medium text-gray-700">Número de Telefone</Label>
          <Input
            id="phone-input"
            type="tel"
            placeholder="(11) 99999-9999"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full h-9 text-sm border-gray-200 focus:border-blue-500 focus:ring-blue-500"
          />
        </div>

        <Button 
          onClick={handleQuickCall}
          disabled={isLoading || !selectedAgent || !phoneNumber}
          className="w-full bg-blue-600 hover:bg-blue-700 h-9 text-sm font-medium rounded-lg shadow-sm mt-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Chamando...
            </>
          ) : (
            <>
              <Phone className="h-4 w-4 mr-2" />
              Fazer Chamada Teste
            </>
          )}
        </Button>

        <div className="bg-blue-50 p-3 rounded-lg mt-2">
          <p className="text-xs text-blue-700 leading-relaxed">
            <strong>Teste rápido:</strong> Faça uma chamada de demonstração com o agente selecionado para verificar a qualidade da voz e responsividade do sistema.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
