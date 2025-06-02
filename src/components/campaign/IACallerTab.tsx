
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Loader2, Play, User, Clock, CheckCircle } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useConversationRelay } from "@/hooks/use-conversation-relay";
import { toast } from "sonner";

interface IACallerTabProps {
  campaignId: string;
  agentId?: string;
  agentName?: string;
}

export function IACallerTab({ campaignId, agentId, agentName }: IACallerTabProps) {
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [testPhoneNumber, setTestPhoneNumber] = useState<string>("");
  const [customMessage, setCustomMessage] = useState<string>("");
  const { makeCall, isLoading, callStatus, transcript } = useConversationRelay();

  // Fetch leads for this campaign
  const { data: leads = [] } = useQuery({
    queryKey: ['campaign-leads', campaignId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("campaign_id", campaignId)
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data || [];
    }
  });

  const handleCallLead = async (lead: any) => {
    if (!agentId) {
      toast.error("Nenhum agente configurado para esta campanha");
      return;
    }

    try {
      const result = await makeCall({
        phoneNumber: lead.phone,
        agentId,
        campaignId,
        leadId: lead.id,
        testMode: false
      });

      if (result) {
        toast.success(`Chamada iniciada para ${lead.name}`);
        setSelectedLead(lead);
      }
    } catch (error) {
      console.error("Erro ao ligar para lead:", error);
    }
  };

  const handleTestCall = async () => {
    if (!agentId || !testPhoneNumber) {
      toast.error("Configure um agente e número de telefone");
      return;
    }

    const cleanPhone = testPhoneNumber.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      toast.error("Número de telefone inválido");
      return;
    }

    try {
      const result = await makeCall({
        phoneNumber: cleanPhone,
        agentId,
        campaignId,
        testMode: true
      });

      if (result) {
        toast.success("Chamada de teste iniciada");
      }
    } catch (error) {
      console.error("Erro na chamada de teste:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="secondary">Pendente</Badge>;
      case "contacted":
        return <Badge variant="default">Contatado</Badge>;
      case "interested":
        return <Badge className="bg-green-100 text-green-800">Interessado</Badge>;
      case "not_interested":
        return <Badge variant="destructive">Não Interessado</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Agent Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Agente Configurado
          </CardTitle>
        </CardHeader>
        <CardContent>
          {agentId ? (
            <div className="flex items-center justify-between">
              <span className="font-medium">{agentName || "Agente Selecionado"}</span>
              <Badge className="bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Ativo
              </Badge>
            </div>
          ) : (
            <p className="text-muted-foreground">
              Nenhum agente configurado para esta campanha
            </p>
          )}
        </CardContent>
      </Card>

      {/* Test Call Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Chamada de Teste
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-phone">Número para Teste</Label>
            <Input
              id="test-phone"
              type="tel"
              placeholder="(11) 99999-9999"
              value={testPhoneNumber}
              onChange={(e) => setTestPhoneNumber(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="custom-message">Mensagem Personalizada (Opcional)</Label>
            <Textarea
              id="custom-message"
              placeholder="Digite uma mensagem específica para este teste..."
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={handleTestCall}
            disabled={isLoading || !agentId || !testPhoneNumber}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Realizando Chamada...
              </>
            ) : (
              <>
                <Phone className="h-4 w-4 mr-2" />
                Fazer Chamada de Teste
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Call Status */}
      {callStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Status da Chamada
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>Status:</span>
                <Badge>{callStatus}</Badge>
              </div>
              {selectedLead && (
                <div className="flex items-center justify-between">
                  <span>Lead:</span>
                  <span className="font-medium">{selectedLead.name}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Live Transcript */}
      {transcript.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Transcrição da Conversa</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {transcript.map((item, index) => (
                <div
                  key={index}
                  className={`p-2 rounded-md ${
                    item.role === "user" 
                      ? "bg-blue-50 ml-4" 
                      : "bg-gray-50 mr-4"
                  }`}
                >
                  <div className="text-xs text-muted-foreground mb-1">
                    {item.role === "user" ? "Cliente" : "Agente"}
                    {item.timestamp && (
                      <span className="ml-2">{item.timestamp}</span>
                    )}
                  </div>
                  <p className="text-sm">{item.text}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads List */}
      <Card>
        <CardHeader>
          <CardTitle>Leads da Campanha</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {leads.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                Nenhum lead encontrado para esta campanha
              </p>
            ) : (
              leads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{lead.name}</span>
                      {getStatusBadge(lead.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">{lead.phone}</p>
                    {lead.email && (
                      <p className="text-xs text-muted-foreground">{lead.email}</p>
                    )}
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCallLead(lead)}
                    disabled={isLoading || !agentId}
                  >
                    <Phone className="h-4 w-4 mr-1" />
                    Ligar
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
