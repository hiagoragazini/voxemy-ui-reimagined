
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
    <Card className="hover:shadow-md transition-shadow h-full">
      <CardHeader className="p-2 pb-1">
        <CardTitle className="flex items-center gap-1.5 text-sm">
          <Phone className="h-3.5 w-3.5 text-blue-600" />
          Chamada Rápida
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 p-2 pt-0">
        <div className="space-y-1">
          <Label htmlFor="agent-select" className="text-xs font-medium">Selecionar Agente</Label>
          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="h-7 text-xs">
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
          <Label htmlFor="phone-input" className="text-xs font-medium">Número de Telefone</Label>
          <Input
            id="phone-input"
            type="tel"
            placeholder="(11) 99999-9999"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full h-7 text-xs"
          />
        </div>

        <Button 
          onClick={handleQuickCall}
          disabled={isLoading || !selectedAgent || !phoneNumber}
          className="w-full bg-blue-600 hover:bg-blue-700 h-7 text-xs"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Chamando...
            </>
          ) : (
            <>
              <Phone className="h-3 w-3 mr-1" />
              Fazer Chamada Teste
            </>
          )}
        </Button>

        <p className="text-xs text-muted-foreground leading-tight">
          Teste rápido de chamada com o agente selecionado
        </p>
      </CardContent>
    </Card>
  );
}
